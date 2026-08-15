/**
 * Escape a CSV cell value.
 */
function escapeCell(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Export leads as a CSV file.
 * @param {Array} leads - array from getLeads()
 */
export function exportLeadsAsCsv(leads) {
  const header = ['nama', 'nomor_hp', 'tanggal', 'jam', 'id_sesi'];
  const rows = leads.map(lead => {
    const d = lead.date ? new Date(lead.date) : new Date();
    const tanggal = d.toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric' });
    const jam = d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    return [
      escapeCell(lead.name || ''),
      escapeCell(lead.phone || ''),
      escapeCell(tanggal),
      escapeCell(jam),
      escapeCell(lead.sessionId || ''),
    ];
  });
  
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `life4cuts-leads-${Date.now()}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
