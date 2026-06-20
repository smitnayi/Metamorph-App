import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export const downloadPdf = async (elementSelector: string, filename: string, isLandscape: boolean = false) => {
  try {
    toast.loading("Preparing PDF...", { id: "pdf-gen" });
    const originalElement = document.querySelector(elementSelector) as HTMLElement;
    
    if (!originalElement) {
      toast.error("Could not find the element to export.", { id: "pdf-gen" });
      return;
    }

    // Capture the element safely by temporarily forcing it to be visible but off-screen
    const originalCssText = originalElement.style.cssText;
    
    // Hide noise pseudoelements globally during PDF gen
    document.body.classList.add('pdf-rendering');
    
    originalElement.style.cssText += 'display: block !important; position: absolute !important; left: -9999px !important; top: 0 !important; background: white !important; width: 210mm; min-height: 297mm; z-index: -1000;';

    // Wait for DOM to repaint
    await new Promise(r => setTimeout(r, 150));

    const canvas = await html2canvas(originalElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Restore
    originalElement.style.cssText = originalCssText;
    document.body.classList.remove('pdf-rendering');
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    const orientation = isLandscape ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Page height might be larger than A4. Let's just fit width.
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    pdf.save(filename);
    
    toast.success("PDF Downloaded successfully!", { id: "pdf-gen" });
  } catch (err) {
    console.error("PDF generation error: ", err);
    toast.error("Failed to generate PDF.", { id: "pdf-gen" });
  }
};
