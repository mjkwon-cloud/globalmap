/**
 * CSV 파싱 및 필터링 모듈
 * 자동 구분자 감지, UTF-8 BOM 제거, 필터링 기능 포함
 */

class CSVParser {
  constructor() {
    this.data = [];
    this.filteredData = [];
    this.uniqueValues = {
      countries: new Set(),
      brands: new Set(),
      channels: new Set(),
      customers: new Set(),
    };
  }

  /**
   * CSV 파일을 File 객체로부터 파싱
   * @param {File} file - 업로드된 CSV 파일
   * @returns {Promise<Array>} 파싱된 데이터 배열
   */
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          this.data = this.parseCSV(content);
          this.extractUniqueValues();
          resolve(this.data);
        } catch (error) {
          reject(new Error(`CSV 파싱 오류: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * CSV 문자열 파싱 (자동 구분자 감지)
   * @param {string} csvContent - CSV 콘텐츠
   * @returns {Array<Object>} 파싱된 객체 배열
   */
  parseCSV(csvContent) {
    // UTF-8 BOM 제거
    let content = csvContent.replace(/^﻿/, '');

    // 첫 줄에서 구분자 감지
    const firstLine = content.split('\n')[0];
    const delimiter = this.detectDelimiter(firstLine);

    const lines = content.split('\n').filter((line) => line.trim() !== '');
    if (lines.length === 0) throw new Error('빈 CSV 파일');

    const headers = this.parseCSVLine(lines[0], delimiter);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      if (values.length > 0) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  }

  /**
   * 첫 줄에서 CSV 구분자 자동 감지
   * @param {string} line - CSV 첫 줄
   * @returns {string} 감지된 구분자 (',' 또는 '\t')
   */
  detectDelimiter(line) {
    const commaCount = (line.match(/,/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;
    return tabCount > commaCount ? '\t' : ',';
  }

  /**
   * CSV 한 줄 파싱 (따옴표 처리)
   * @param {string} line - CSV 한 줄
   * @param {string} delimiter - 구분자
   * @returns {Array<string>} 파싱된 필드 배열
   */
  parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * 고유 값 추출 (국가, 브랜드, 채널, 거래처)
   */
  extractUniqueValues() {
    this.uniqueValues = {
      countries: new Set(),
      brands: new Set(),
      channels: new Set(),
      customers: new Set(),
    };

    this.data.forEach((row) => {
      // 한글/영문 필드명 모두 지원
      const country = row['국가'] || row['Country'] || '';
      const brand = row['브랜드'] || row['Brand'] || '';
      const channel = row['채널'] || row['Channel'] || '';
      const customers =
        (row['본사 거래처 리스트'] || row['Headquarters Customers'] || '') +
        ' ' +
        (row['법인 거래처 리스트'] || row['Corporate Customers'] || '');

      if (country) this.uniqueValues.countries.add(country);
      if (brand) this.uniqueValues.brands.add(brand);
      if (channel) this.uniqueValues.channels.add(channel);

      customers.split(/[,;]/).forEach((customer) => {
        const trimmed = customer.trim();
        if (trimmed) this.uniqueValues.customers.add(trimmed);
      });
    });
  }

  /**
   * 필터링 적용 (AND 조건)
   * @param {Object} filters - {country, brand, channel}
   * @returns {Array<Object>} 필터링된 데이터
   */
  filter(filters = {}) {
    this.filteredData = this.data.filter((row) => {
      const country = row['국가'] || row['Country'] || '';
      const brand = row['브랜드'] || row['Brand'] || '';
      const channel = row['채널'] || row['Channel'] || '';

      // AND 조건: 모든 필터가 일치해야 함
      if (filters.country && country !== filters.country) return false;
      if (filters.brand && brand !== filters.brand) return false;
      if (filters.channel && channel !== filters.channel) return false;

      return true;
    });

    return this.filteredData;
  }

  /**
   * 통계 계산
   * @returns {Object} 통계 정보
   */
  getStatistics(data = this.data) {
    const stats = {
      totalChannels: new Set(),
      totalCountries: new Set(),
      totalBrands: new Set(),
      totalCustomers: new Set(),
    };

    data.forEach((row) => {
      const country = row['국가'] || row['Country'] || '';
      const brand = row['브랜드'] || row['Brand'] || '';
      const channel = row['채널'] || row['Channel'] || '';
      const customers =
        (row['본사 거래처 리스트'] || row['Headquarters Customers'] || '') +
        ' ' +
        (row['법인 거래처 리스트'] || row['Corporate Customers'] || '');

      if (channel) stats.totalChannels.add(channel);
      if (country) stats.totalCountries.add(country);
      if (brand) stats.totalBrands.add(brand);

      customers.split(/[,;]/).forEach((c) => {
        const trimmed = c.trim();
        if (trimmed) stats.totalCustomers.add(trimmed);
      });
    });

    return {
      channels: stats.totalChannels.size,
      countries: stats.totalCountries.size,
      brands: stats.totalBrands.size,
      customers: stats.totalCustomers.size,
    };
  }

  /**
   * 모든 고유 값 반환
   * @returns {Object} 고유 값 객체
   */
  getUniqueValues() {
    return {
      countries: Array.from(this.uniqueValues.countries).sort(),
      brands: Array.from(this.uniqueValues.brands).sort(),
      channels: Array.from(this.uniqueValues.channels).sort(),
      customers: Array.from(this.uniqueValues.customers).sort(),
    };
  }

  /**
   * 필터 초기화
   */
  reset() {
    this.filteredData = [...this.data];
  }
}

// 전역 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSVParser;
}
