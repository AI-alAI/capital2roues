package ma.capital2roues.capital2roues.service;

import ma.capital2roues.capital2roues.model.Produit;
import ma.capital2roues.capital2roues.repository.ProduitRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    @Autowired
    private ProduitRepository produitRepository;

    public byte[] exportProduitsExcel() throws Exception {
        List<Produit> produits = produitRepository.findAll();
        
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Produits");
        
        // Styles
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 12);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);
        
        CellStyle cellStyle = workbook.createCellStyle();
        cellStyle.setBorderBottom(BorderStyle.THIN);
        cellStyle.setBorderTop(BorderStyle.THIN);
        cellStyle.setBorderLeft(BorderStyle.THIN);
        cellStyle.setBorderRight(BorderStyle.THIN);
        
        CellStyle priceStyle = workbook.createCellStyle();
        priceStyle.setBorderBottom(BorderStyle.THIN);
        priceStyle.setBorderTop(BorderStyle.THIN);
        priceStyle.setBorderLeft(BorderStyle.THIN);
        priceStyle.setBorderRight(BorderStyle.THIN);
        priceStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
        
        CellStyle titleStyle = workbook.createCellStyle();
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);
        titleStyle.setFont(titleFont);
        titleStyle.setAlignment(HorizontalAlignment.CENTER);
        
        // Titre
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("CAPITAL 2 ROUES - LISTE DES PRODUITS");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 10));
        
        // Date
        Row dateRow = sheet.createRow(1);
        Cell dateCell = dateRow.createCell(0);
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        dateCell.setCellValue("Exporté le : " + dateStr);
        dateCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 10));
        
        // En-têtes
        int rowNum = 3;
        String[] headers = {
            "ID", "Nom", "Référence", "VIN", "Année", "Couleur",
            "Catégorie", "Prix Achat", "Prix Vente", "Marge", "Stock", "Garantie"
        };
        
        Row headerRow = sheet.createRow(rowNum);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        
        // Données
        int dataRowNum = rowNum + 1;
        for (Produit p : produits) {
            Row row = sheet.createRow(dataRowNum++);
            int col = 0;
            
            createCell(row, col++, String.valueOf(p.getId()), cellStyle);
            createCell(row, col++, p.getNom(), cellStyle);
            createCell(row, col++, p.getReference(), cellStyle);
            createCell(row, col++, p.getVin() != null ? p.getVin() : "", cellStyle);
            createCell(row, col++, p.getAnnee() != null ? String.valueOf(p.getAnnee()) : "", cellStyle);
            createCell(row, col++, p.getCouleur() != null ? p.getCouleur() : "", cellStyle);
            
            String categorie = p.getCategorie() != null ? p.getCategorie().getNom() : "";
            createCell(row, col++, categorie, cellStyle);
            
            createNumberCell(row, col++, p.getPrixAchat(), priceStyle);
            createNumberCell(row, col++, p.getPrixVente(), priceStyle);
            
            BigDecimal marge = p.getPrixVente().subtract(p.getPrixAchat());
            createNumberCell(row, col++, marge, priceStyle);
            
            createCell(row, col++, String.valueOf(p.getQuantiteStock()), cellStyle);
            createCell(row, col++, p.getGarantie() != null ? p.getGarantie() : "", cellStyle);
        }
        
        // Auto size
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 500);
        }
        
        // Total
        Row totalRow = sheet.createRow(dataRowNum + 1);
        Cell totalLabel = totalRow.createCell(0);
        totalLabel.setCellValue("TOTAL PRODUITS : " + produits.size());
        totalLabel.setCellStyle(headerStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(dataRowNum + 1, dataRowNum + 1, 0, 5));
        
        // Export
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        workbook.write(baos);
        workbook.close();
        
        return baos.toByteArray();
    }
    
    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }
    
    private void createNumberCell(Row row, int col, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value.doubleValue());
        cell.setCellStyle(style);
    }
}