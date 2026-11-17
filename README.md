# PDF Viewer with Custom Open Action and OCR-Based Restricted Keyword Detection

This sample demonstrates how to replace the default **Open** toolbar action of the Syncfusion React PDF Viewer with a custom file-uploader-based action, and how to analyze the selected PDF **on the server** before it is loaded into the viewer.

When a user opens a PDF through the custom toolbar button, the document is sent to an ASP.NET Core service where it is **converted into an OCR-searchable document** using the Syncfusion .NET PDF library. The searchable text is extracted from all pages and scanned for **restricted keywords** (configurable, defaults: `knife`, `bomb`, `alcohol`) using a case-insensitive search.

- If restricted keywords are found, a **Syncfusion Dialog** is shown:

  *"This document contains restricted keywords. Do you want to continue loading the document?"*

  - **Yes** — the PDF is loaded into the PDF Viewer.
  - **No** — the operation is cancelled and the selected file is discarded.
- If no restricted keywords are found, the PDF is loaded into the viewer directly, without any dialog.

## Sample Structure

| Folder | Description |
|---|---|
| `Client Side` | React (TypeScript) + Vite app hosting the Syncfusion PDF Viewer |
| `Server Side` | ASP.NET Core 8.0 Web API (`PdfViewerController`) handling OCR conversion, text extraction, and keyword detection |

### Client Side

- `src/App.tsx` — Contains the PDF Viewer with a custom `custom_file_open` toolbar item (replacing the default `OpenOption`), a hidden file input for PDF selection, and the Syncfusion Dialog used for keyword-confirmation.

### Server Side

- `PdfViewerController.cs` — Single service file containing the entire server-side implementation:
  - `AnalyzePdf` (POST `/pdfviewer/AnalyzePdf`) — receives the uploaded PDF, converts it to an OCR-searchable document, extracts the text, and returns the restricted keywords found.
  - `ConvertPdfToOcrSearchable` — loads the PDF with `PdfLoadedDocument` and runs `OCRProcessor.PerformOCR` to add a hidden, searchable text layer (so scanned/image-only PDFs are also searchable). Falls back to the original document if OCR fails.
  - `ExtractTextFromOcrPdf` — reads the searchable text from every page of the OCR-processed document.
  - `DetectRestrictedKeywords` — performs a case-insensitive search across the extracted text for the configured keywords and returns the ones found.

## How to Run the Sample

### 1. Run the Server Side (ASP.NET Core service)

```shell
cd "Server Side"
dotnet restore
dotnet run
```

The service starts at `https://localhost:7255` (see `Properties/launchSettings.json`). The client app posts uploaded PDFs to `https://localhost:7255/pdfviewer/AnalyzePdf`.

### 2. Run the Client Side (React app)

```shell
cd "Client Side"
npm install
npm run dev
```

Open the Vite dev-server URL shown in the terminal and use the custom **Open** button on the PDF Viewer toolbar to select a PDF. The document is analyzed first, then loaded into the viewer (after confirmation, if restricted keywords were detected).

## Configuring the Restricted Keywords

The restricted keywords are defined in the `DetectRestrictedKeywords` method of `Server Side/PdfViewerController.cs`:

```csharp
List<string> restrictedKeywords = new List<string>
{
    "knife",
    "bomb",
    "alcohol",
    // Add additional trigger words here
};
```

The search is case-insensitive and covers the entire document, including text made searchable by OCR.
