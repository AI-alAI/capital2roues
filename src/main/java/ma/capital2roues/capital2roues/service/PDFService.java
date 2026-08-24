package ma.capital2roues.capital2roues.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import ma.capital2roues.capital2roues.model.LigneVente;
import ma.capital2roues.capital2roues.model.Vente;
import ma.capital2roues.capital2roues.repository.VenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PDFService {

    @Autowired
    private VenteRepository venteRepository;

    public byte[] generateFacturePDF(Long venteId) throws Exception {
        Vente vente = venteRepository.findById(venteId)
                .orElseThrow(() -> new RuntimeException("Vente non trouvée"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        // Créer le document
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, baos);
        document.open();

        // ===== EN-TÊTE =====
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, new BaseColor(30, 30, 46));
        Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.NORMAL, new BaseColor(100, 100, 120));
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, new BaseColor(233, 69, 96));
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font totalFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, new BaseColor(233, 69, 96));

        // Titre
        Paragraph title = new Paragraph("🏍️ Capital 2 Roues", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        
        Paragraph subtitle = new Paragraph("Facture de vente", subtitleFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitle);
        
        document.add(new Paragraph(" "));

        // Ligne séparatrice
        Paragraph separator = new Paragraph("─────────────────────────────────────────────────");
        separator.setAlignment(Element.ALIGN_CENTER);
        document.add(separator);

        document.add(new Paragraph(" "));

        // ===== INFORMATIONS =====
        // Gestion de la date - Version SÉCURISÉE
        String dateStr = "Date non disponible";
        try {
            if (vente.getDateVente() != null) {
                // Convertir LocalDateTime en String directement
                dateStr = vente.getDateVente().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            }
        } catch (Exception e) {
            dateStr = "Date invalide";
        }

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setSpacingAfter(10);

        // Colonne gauche
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.addElement(new Paragraph("N° Facture : ", headerFont));
        leftCell.addElement(new Paragraph("Date : ", headerFont));
        leftCell.addElement(new Paragraph("Statut : ", headerFont));
        leftCell.addElement(new Paragraph(" "));
        leftCell.addElement(new Paragraph("Client :", headerFont));
        leftCell.addElement(new Paragraph("    " + vente.getClient().getNom() + " " + vente.getClient().getPrenom(), normalFont));
        if (vente.getClient().getTelephone() != null && !vente.getClient().getTelephone().isEmpty()) {
            leftCell.addElement(new Paragraph("    Tél: " + vente.getClient().getTelephone(), normalFont));
        }
        if (vente.getClient().getEmail() != null && !vente.getClient().getEmail().isEmpty()) {
            leftCell.addElement(new Paragraph("    Email: " + vente.getClient().getEmail(), normalFont));
        }
        if (vente.getClient().getAdresse() != null && !vente.getClient().getAdresse().isEmpty()) {
            leftCell.addElement(new Paragraph("    Adresse: " + vente.getClient().getAdresse(), normalFont));
        }

        // Colonne droite
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(new Paragraph("", headerFont));
        rightCell.addElement(new Paragraph("#" + vente.getId(), boldFont));
        rightCell.addElement(new Paragraph(dateStr, normalFont));
        rightCell.addElement(new Paragraph("", normalFont));
        rightCell.addElement(new Paragraph("", headerFont));
        rightCell.addElement(new Paragraph("", normalFont));
        rightCell.addElement(new Paragraph("", normalFont));
        rightCell.addElement(new Paragraph("", normalFont));
        rightCell.addElement(new Paragraph("", normalFont));

        infoTable.addCell(leftCell);
        infoTable.addCell(rightCell);
        document.add(infoTable);

        document.add(new Paragraph(" "));

        // ===== TABLEAU DES PRODUITS =====
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setSpacingAfter(15);
        table.setWidths(new float[]{3f, 1f, 2f, 2f});

        // En-têtes
        String[] headers = {"Produit", "Quantité", "Prix Unitaire", "Total"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(new BaseColor(240, 240, 245));
            cell.setPadding(8);
            cell.setBorderWidth(1);
            cell.setBorderColor(new BaseColor(200, 200, 200));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        // Lignes
        for (LigneVente ligne : vente.getLignes()) {
            table.addCell(createCell(ligne.getProduit().getNom(), Element.ALIGN_LEFT));
            table.addCell(createCell(String.valueOf(ligne.getQuantite()), Element.ALIGN_CENTER));
            table.addCell(createCell(String.format("%.2f DH", ligne.getPrixUnitaire()), Element.ALIGN_RIGHT));
            table.addCell(createCell(String.format("%.2f DH", ligne.getTotalLigne()), Element.ALIGN_RIGHT));
        }

        document.add(table);

        // ===== TOTAL =====
        Paragraph totalParagraph = new Paragraph();
        totalParagraph.setAlignment(Element.ALIGN_RIGHT);
        
        Chunk totalLabel = new Chunk("Total TTC : ", boldFont);
        Chunk totalValue = new Chunk(String.format("%.2f DH", vente.getTotal()), totalFont);
        
        totalParagraph.add(totalLabel);
        totalParagraph.add(totalValue);
        document.add(totalParagraph);

        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ===== PIED DE PAGE =====
        Paragraph footer = new Paragraph();
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setFont(new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(150, 150, 170)));
        footer.add("─────────────────────────────────────────────────");
        footer.add(Chunk.NEWLINE);
        footer.add("Merci pour votre confiance !");
        footer.add(Chunk.NEWLINE);
        footer.add("Capital 2 Roues - Tél: +212 5XX-XXXXXX");
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }

    private PdfPCell createCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.FontFamily.HELVETICA, 12)));
        cell.setPadding(8);
        cell.setBorderWidth(1);
        cell.setBorderColor(new BaseColor(200, 200, 200));
        cell.setHorizontalAlignment(alignment);
        return cell;
    }
}