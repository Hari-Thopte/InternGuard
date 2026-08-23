"""Isolated PDF/image text and metadata worker for InternGuard."""

from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys

os.environ.setdefault("OPENCV_IO_MAX_IMAGE_PIXELS", "40000000")

import cv2
import pymupdf as fitz
import numpy as np


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


MAX_TEXT = 40_000
MAX_PDF_PAGES = 12
MAX_QR_CODES = 20
MAX_QR_VALUE = 2_048
MAX_RENDER_PIXELS = 16_000_000


def tesseract_command() -> str:
    configured = os.environ.get("TESSERACT_COMMAND")
    windows_default = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    if configured:
        return configured
    if windows_default.exists():
        return str(windows_default)
    return "tesseract"


def ocr_image(image_path: Path) -> str:
    completed = subprocess.run(
        [tesseract_command(), str(image_path), "stdout", "-l", "eng"],
        capture_output=True,
        check=False,
        timeout=25,
    )
    if completed.returncode != 0:
        error = completed.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(error or "Tesseract could not read the image.")
    return completed.stdout.decode("utf-8", errors="replace").strip()


def decode_qr_image(image: np.ndarray) -> list[str]:
    if image is None or image.size == 0:
        return []
    detector = cv2.QRCodeDetector()
    values: list[str] = []
    try:
        detected, decoded, _points, _straight = detector.detectAndDecodeMulti(image)
        if detected:
            values.extend(str(value) for value in decoded if value)
    except cv2.error:
        pass
    if not values:
        try:
            value, _points, _straight = detector.detectAndDecode(image)
            if value:
                values.append(str(value))
        except cv2.error:
            pass
    return [value[:MAX_QR_VALUE] for value in values[:MAX_QR_CODES]]


def decode_qr_pixmap(pixmap: fitz.Pixmap) -> list[str]:
    pixels = np.frombuffer(pixmap.samples, dtype=np.uint8)
    image = pixels.reshape(pixmap.height, pixmap.width, pixmap.n)
    if pixmap.n == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)
    elif pixmap.n == 3:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    return decode_qr_image(image)


def inspect_pdf(path: Path) -> dict[str, object]:
    document = fitz.open(path)
    try:
        if document.needs_pass:
            raise ValueError("Password-protected PDFs are not supported.")
        if document.page_count < 1:
            raise ValueError("The PDF contains no readable pages.")
        if document.page_count > MAX_PDF_PAGES:
            raise ValueError(
                f"The PDF has too many pages. Maximum: {MAX_PDF_PAGES}."
            )

        extracted_pages: list[str] = []
        qr_codes: list[str] = []
        signature_fields = 0
        used_ocr = False
        for index, page in enumerate(document):
            page_text = page.get_text("text", sort=True).strip()
            natural_pixels = max(1.0, page.rect.width * page.rect.height)
            render_scale = min(2.0, (MAX_RENDER_PIXELS / natural_pixels) ** 0.5)
            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(render_scale, render_scale), alpha=False
            )
            qr_codes.extend(decode_qr_pixmap(pixmap))
            if len(page_text) < 30:
                used_ocr = True
                image_path = path.parent / f"page-{index + 1}.png"
                pixmap.save(image_path)
                page_text = ocr_image(image_path)
            extracted_pages.append(page_text)
            widgets = page.widgets()
            if widgets:
                signature_fields += sum(
                    1
                    for widget in widgets
                    if str(widget.field_type_string).lower() == "signature"
                )

        metadata = {
            str(key): str(value)
            for key, value in (document.metadata or {}).items()
            if value not in (None, "")
        }
        return {
            "text": "\n\n".join(extracted_pages)[:MAX_TEXT],
            "pageCount": document.page_count,
            "metadata": metadata,
            "signatureFields": signature_fields,
            "usedOcr": used_ocr,
            "qrCodes": list(dict.fromkeys(qr_codes))[:MAX_QR_CODES],
        }
    finally:
        document.close()


def inspect_image(path: Path) -> dict[str, object]:
    image = cv2.imread(str(path))
    if image is None:
        raise ValueError("The image could not be decoded safely.")
    qr_codes = decode_qr_image(image)
    text = ocr_image(path)
    if len(text) < 15 and not qr_codes:
        raise ValueError(
            "The image did not contain enough readable text. Upload a sharper image."
        )
    return {
        "text": text[:MAX_TEXT],
        "pageCount": 1,
        "metadata": {},
        "signatureFields": 0,
        "usedOcr": True,
        "qrCodes": qr_codes,
    }


def inspect_docx(path: Path) -> dict[str, object]:
    import zipfile
    import xml.etree.ElementTree as ET

    try:
        with zipfile.ZipFile(path, "r") as zf:
            if "word/document.xml" not in zf.namelist():
                raise ValueError("Invalid DOCX format: missing word/document.xml")
            xml_content = zf.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            texts = [e.text for e in tree.iter() if e.tag.endswith("}t") and e.text]
            full_text = " ".join(texts).strip()

            metadata = {}
            if "docProps/core.xml" in zf.namelist():
                core_xml = zf.read("docProps/core.xml")
                core_tree = ET.fromstring(core_xml)
                for e in core_tree.iter():
                    tag = e.tag.split("}")[-1].lower()
                    if tag in ("creator", "lastmodifiedby", "created", "modified", "title", "subject", "keywords"):
                        if e.text:
                            metadata[tag] = str(e.text)

            if len(full_text) < 15:
                raise ValueError("The DOCX document did not contain enough readable text.")

            return {
                "text": full_text[:MAX_TEXT],
                "pageCount": max(1, len(full_text) // 2500),
                "metadata": metadata,
                "signatureFields": 0,
                "usedOcr": False,
                "qrCodes": [],
            }
    except Exception as err:
        raise ValueError(f"Could not parse DOCX file: {err}")


def main() -> None:
    if len(sys.argv) != 3:
        raise ValueError("Expected a file path and file kind.")
    path = Path(sys.argv[1]).resolve(strict=True)
    kind = sys.argv[2]
    if kind == "pdf":
        result = inspect_pdf(path)
    elif kind == "image":
        result = inspect_image(path)
    elif kind == "docx":
        result = inspect_docx(path)
    else:
        raise ValueError("Unsupported document kind.")
    print(json.dumps(result, ensure_ascii=True))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(
            json.dumps({"error": str(error)}, ensure_ascii=True),
            file=sys.stderr,
        )
        raise SystemExit(1)
