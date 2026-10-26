/**
 * Trích xuất URL Google Maps từ chuỗi địa điểm và/hoặc tọa độ GPS.
 * Hỗ trợ các định dạng:
 * - Tọa độ số: "21.028300, 105.854000" hoặc "Vị trí hiện tại (21.028300, 105.854000)"
 * - Tọa độ DMS/Degree: "21.028300° N, 105.854000° E"
 * - Tên địa điểm, địa chỉ bằng chữ: "Tòa nhà Keangnam, Hà Nội"
 */
export const getGoogleMapsUrl = (location?: string, coordinates?: string): string => {
  if (!location && !coordinates) return '';

  const combined = `${coordinates || ''} ${location || ''}`.trim();

  // Tìm kiếm cặp tọa độ vĩ độ/kinh độ dạng số thập phân (có thể kèm ° N/S, ° E/W)
  const coordMatch = combined.match(/(-?\d+(?:\.\d+)?)\s*°?\s*([NSns])?\s*[,/ ]+\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EWew])?/);
  if (coordMatch && coordMatch[1] && coordMatch[3]) {
    let lat = parseFloat(coordMatch[1]);
    let lng = parseFloat(coordMatch[3]);
    if (coordMatch[2]?.toUpperCase() === 'S') lat = -lat;
    if (coordMatch[4]?.toUpperCase() === 'W') lng = -lng;
    if (!isNaN(lat) && !isNaN(lng)) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
  }

  // Nếu là địa chỉ/tên địa điểm chữ thông thường, lọc bỏ các tiền tố không cần thiết
  const cleanQuery = (location || coordinates || '')
    .replace(/^Vị trí hiện tại\s*\(?/i, '')
    .replace(/\)$/, '')
    .trim();

  if (cleanQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`;
  }

  return '';
};
