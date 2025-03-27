import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
};

export const exportToPDF = (data, filename, title) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    
    // Add timestamp
    doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 25);
    
    // Add table
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header]));
    
    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
};

export const formatAlertDataForExport = (alerts) => {
    return alerts.map(alert => ({
        timestamp: format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        component: alert.component,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        status: alert.status,
        metadata: JSON.stringify(alert.metadata || {})
    }));
};

export const formatMetricsDataForExport = (metrics) => {
    return [{
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        cpuUsage: `${metrics.cpuUsage}%`,
        memoryUsage: `${metrics.memoryUsage}%`,
        diskUsage: `${metrics.diskUsage}%`,
        networkIO: `${metrics.networkIO} MB/s`,
        responseTime: `${metrics.responseTime}ms`
    }];
}; 