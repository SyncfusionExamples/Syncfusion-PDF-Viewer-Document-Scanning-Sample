import { useEffect, useRef, useState } from 'react';
import { PdfViewerComponent, Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView,
         ThumbnailView, Print, TextSelection, Annotation, TextSearch, FormFields, FormDesigner,
         PageOrganizer, Inject } from '@syncfusion/ej2-react-pdfviewer';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { showSpinner, hideSpinner, createSpinner } from '@syncfusion/ej2-react-popups';

export default function App() {
  const pdfViewerRef = useRef<PdfViewerComponent>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<DialogComponent>(null);
  const [restrictedKeywordsFound, setRestrictedKeywordsFound] = useState<string[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create the spinner once when the app mounts
  useEffect(() => {
    const container = document.getElementById('pdf-loading-container');
    if (container) {
      createSpinner({ target: container });
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show loading indicator from the moment the file is selected
    setIsLoading(true);
    showSpinner(document.getElementById('pdf-loading-container')!);
    setPendingFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://localhost:7255/pdfviewer/AnalyzePdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze PDF');
      }

      const result = await response.json();

      if (result.restrictedKeywordsFound && result.restrictedKeywordsFound.length > 0) {
        setRestrictedKeywordsFound(result.restrictedKeywordsFound);
        dialogRef.current?.show();
      } else {
        // No restricted keywords found, load directly
        loadPdfFile(file);
      }
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      alert('Error analyzing PDF. Please try again.');
    } finally {
      // Hide loading indicator once conversion/analysis is complete
      hideSpinner(document.getElementById('pdf-loading-container')!);
      setIsLoading(false);
    }
  };

  const loadPdfFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = (e.target?.result as string)?.split(',')[1];
      if (pdfViewerRef.current) {
        pdfViewerRef.current.load(base64String, "null");
      }
    };
    reader.readAsDataURL(file);
    setPendingFile(null);
  };

  const handleDialogYes = () => {
    if (pendingFile) {
      loadPdfFile(pendingFile);
    }
    dialogRef.current?.hide();
  };

  const handleDialogNo = () => {
    dialogRef.current?.hide();
    setPendingFile(null);
    setRestrictedKeywordsFound([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToolbarClick = (args: any) => {
    if (args.item.id === 'custom_file_open') {
      fileInputRef.current?.click();
    }
  };

  const toolbarItems = [
    {
      id: 'custom_file_open',
      text: 'Open',
      prefixIcon: 'e-icons e-folder-open',
      align: 'Left'
    },
    'PageNavigationTool',
    'MagnificationTool',
    'PanTool',
    'SelectionTool',
    'SearchOption',
    'PrintOption',
    'DownloadOption',
    'UndoRedoTool',
    'AnnotationEditTool',
    'RedactionEditTool',
    'FormDesignerEditTool',
    'CommentTool',
    'SubmitForm',
    'OrganizePagesTool'
  ];

  const dialogButtons = [
    {
      buttonModel: {
        content: 'Yes',
        cssClass: 'e-flat',
        isPrimary: true,
      },
      click: handleDialogYes,
    },
    {
      buttonModel: {
        content: 'No',
        cssClass: 'e-flat',
      },
      click: handleDialogNo,
    },
  ];

  return (
    <div style={{ marginTop: '100px', position: 'relative' }}>
      {/* Loading indicator shown from file selection until OCR conversion/analysis completes */}
      <div
        id="pdf-loading-container"
        className={isLoading ? 'pdf-loading-overlay' : 'pdf-loading-hidden'}
      >
        <div className="pdf-loading-text">Analyzing document, please wait…</div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={isLoading}
      />

      <PdfViewerComponent
        ref={pdfViewerRef}
        id="container"
        resourceUrl="https://cdn.syncfusion.com/ej2/35.1.46/dist/ej2-pdfviewer-lib"
        toolbarSettings={{
          toolbarItems: toolbarItems as any,
        }}
        toolbarClick={handleToolbarClick}
        style={{ height: '640px' }}
      >
        <Inject
          services={[
            Toolbar, Magnification, Navigation, Annotation, LinkAnnotation,
            BookmarkView, ThumbnailView, Print, TextSelection, TextSearch,
            FormFields, FormDesigner, PageOrganizer
          ]}
        />
      </PdfViewerComponent>

      <DialogComponent
        ref={dialogRef}
        header="Restricted Keywords Detected"
        buttons={dialogButtons}
        showCloseIcon={true}
        isModal={true}
        visible={false}
        width="400px"
      >
        <div>
          <p>This document contains restricted keywords:</p>
          <ul style={{ marginTop: '10px' }}>
            {restrictedKeywordsFound.map((keyword, index) => (
              <li key={index} style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                {keyword}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '10px' }}>Do you want to continue loading the document?</p>
        </div>
      </DialogComponent>
    </div>
  );
}
