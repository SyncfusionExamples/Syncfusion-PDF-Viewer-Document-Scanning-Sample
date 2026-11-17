using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Syncfusion.Pdf.Parsing;
using Syncfusion.Pdf;
using Syncfusion.OCRProcessor;

namespace PdfViewerWebService_8
{
    [Route("[controller]")]
    [ApiController]
    public class PdfViewerController : ControllerBase
    {
        private IWebHostEnvironment _hostingEnvironment;
        //Initialize the memory cache object   
        public IMemoryCache _cache;
        public PdfViewerController(IWebHostEnvironment hostingEnvironment, IMemoryCache cache)
        {
            _hostingEnvironment = hostingEnvironment;
            _cache = cache;
            Console.WriteLine("PdfViewerController initialized");
        }

        [HttpPost("AnalyzePdf")]
        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]
        [Route("[controller]/AnalyzePdf")]
        //Post action for analyzing PDF and detecting restricted keywords
        public async Task<IActionResult> AnalyzePdf()
        {
            try
            {
                var file = Request.Form.Files.FirstOrDefault();
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { error = "No file uploaded" });
                }

                using (var stream = new MemoryStream())
                {
                    await file.CopyToAsync(stream);
                    stream.Position = 0;

                    // Convert PDF to OCR-searchable document
                    MemoryStream ocrPdfStream = ConvertPdfToOcrSearchable(stream);
                    ocrPdfStream.Position = 0;

                    // Extract searchable text from OCR-processed PDF
                    string extractedText = ExtractTextFromOcrPdf(ocrPdfStream);

                    // Detect restricted keywords
                    List<string> foundKeywords = DetectRestrictedKeywords(extractedText);

                    // Return results
                    return Ok(new
                    {
                        restrictedKeywordsFound = foundKeywords,
                        extractedText = extractedText
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing PDF: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private MemoryStream ConvertPdfToOcrSearchable(MemoryStream stream)
        {
            try
            {
                Console.WriteLine("Starting OCR conversion...");
                PdfLoadedDocument loadedDocument = new PdfLoadedDocument(stream);
                
                // Create OCR processor with Tesseract engine
                OCRProcessor ocrProcessor = new OCRProcessor();
                
                // Set the OCR language (English by default)
                ocrProcessor.Settings.Language = Languages.English;

                // Perform OCR on the PDF document
                // This converts image-based PDFs to searchable PDFs by adding hidden text layers
                ocrProcessor.PerformOCR(loadedDocument);

                Console.WriteLine("OCR conversion completed successfully");

                // Save the OCR-processed PDF to a memory stream
                MemoryStream ocrStream = new MemoryStream();
                loadedDocument.Save(ocrStream);
                ocrStream.Position = 0;

                loadedDocument.Close();

                return ocrStream;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during OCR conversion: {ex.Message}");
                // If OCR fails, return the original stream for text extraction fallback
                stream.Position = 0;
                return stream;
            }
        }

        private string ExtractTextFromOcrPdf(MemoryStream stream)
        {
            try
            {
                PdfLoadedDocument loadedDocument = new PdfLoadedDocument(stream);
                StringBuilder extractedText = new StringBuilder();

                for (int i = 0; i < loadedDocument.Pages.Count; i++)
                {
                    PdfLoadedPage page = (PdfLoadedPage)loadedDocument.Pages[i];
                    string pageText = page.ExtractText();
                    extractedText.Append(pageText);
                    extractedText.Append(" ");
                }

                loadedDocument.Close();
                return extractedText.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting text from OCR PDF: {ex.Message}");
                return string.Empty;
            }
        }

        private List<string> DetectRestrictedKeywords(string text)
        {
            List<string> restrictedKeywords = new List<string>
            {
                "knife",
                "bomb",
                "alcohol"
            };

            List<string> foundKeywords = new List<string>();
            string lowerText = text.ToLower();

            foreach (string keyword in restrictedKeywords)
            {
                if (lowerText.Contains(keyword.ToLower()))
                {
                    foundKeywords.Add(keyword);
                }
            }

            return foundKeywords;
        }
    }
}