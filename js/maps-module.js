/**
 * Google Maps 통합 모듈
 * 지도 초기화, 마커 표시, 정보창 관리
 */

class MapsModule {
  constructor(containerId, apiKey = null) {
    this.containerId = containerId;
    this.apiKey = apiKey;
    this.map = null;
    this.markers = [];
    this.infoWindows = [];
    this.countryCoords = this.getCountryCoordinates();
  }

  /**
   * 25개 국가의 좌표 데이터
   * @returns {Object} 국가명: {lat, lng}
   */
  getCountryCoordinates() {
    return {
      스웨덴: { lat: 60.128161, lng: 18.643501 },
      영국: { lat: 55.3781, lng: -3.436 },
      덴마크: { lat: 56.26, lng: 9.501785 },
      독일: { lat: 51.165691, lng: 10.451526 },
      프랑스: { lat: 46.227638, lng: 2.213749 },
      스페인: { lat: 40.463667, lng: -3.74922 },
      포르투갈: { lat: 39.3999, lng: -8.224454 },
      폴란드: { lat: 51.919438, lng: 19.145136 },
      이탈리아: { lat: 41.871940, lng: 12.56738 },
      네덜란드: { lat: 52.132633, lng: 5.291265 },
      노르웨이: { lat: 60.472024, lng: 8.468946 },
      핀란드: { lat: 61.524010, lng: 25.748151 },
      체코: { lat: 49.817492, lng: 15.472962 },
      헝가리: { lat: 47.162494, lng: 19.503304 },
      세르비아: { lat: 44.016521, lng: 21.005859 },
      크로아티아: { lat: 45.1, lng: 15.2 },
      슬로바키아: { lat: 48.669026, lng: 19.699024 },
      보스니아 헤르체고비나: { lat: 43.915886, lng: 17.679076 },
      슬로베니아: { lat: 46.151925, lng: 14.995463 },
      북마케도니아: { lat: 41.608635, lng: 21.745275 },
      불가리아: { lat: 42.733883, lng: 25.48583 },
      안도라: { lat: 42.546245, lng: 1.601554 },
      캐나다: { lat: 56.1304, lng: -106.3468 },
      호주: { lat: -25.2744, lng: 133.7751 },
      뉴질랜드: { lat: -40.9006, lng: 174.886 },
    };
  }

  /**
   * Google Maps 초기화
   */
  initMap() {
    if (!document.getElementById(this.containerId)) {
      console.error(`Container with ID "${this.containerId}" not found`);
      return false;
    }

    const centerLat = 54.5260;
    const centerLng = 15.2551;

    this.map = new google.maps.Map(document.getElementById(this.containerId), {
      zoom: 3.5,
      center: { lat: centerLat, lng: centerLng },
      mapTypeControl: true,
      fullscreenControl: true,
      gestureHandling: 'greedy',
    });

    return true;
  }

  /**
   * 마커 추가
   * @param {string} country - 국가명
   * @param {string} label - 마커 라벨
   * @param {Object} data - 추가 데이터
   * @param {Function} onClickCallback - 마커 클릭 콜백
   */
  addMarker(country, label = country, data = {}, onClickCallback = null) {
    if (!this.countryCoords[country]) {
      console.warn(`Coordinates for ${country} not found`);
      return null;
    }

    const coords = this.countryCoords[country];
    const marker = new google.maps.Marker({
      position: coords,
      map: this.map,
      title: country,
      label: {
        text: label,
        fontSize: '12px',
        fontWeight: 'bold',
      },
    });

    // 마커 클릭 이벤트
    marker.addListener('click', () => {
      if (onClickCallback) {
        onClickCallback(country, data);
      }
      this.showInfoWindow(marker, country, data);
    });

    this.markers.push({ marker, country, data });
    return marker;
  }

  /**
   * 모든 마커 표시
   * @param {Array} dataByCountry - 국가별 데이터 배열
   * @param {Function} onClickCallback - 마커 클릭 콜백
   */
  addAllMarkers(dataByCountry, onClickCallback = null) {
    this.clearMarkers();

    dataByCountry.forEach(({ country, channels, brands, customers }) => {
      const label = `${channels}`;
      this.addMarker(
        country,
        label,
        { channels, brands, customers },
        onClickCallback
      );
    });
  }

  /**
   * 정보창 표시
   * @param {google.maps.Marker} marker - 마커
   * @param {string} country - 국가명
   * @param {Object} data - 마커 데이터
   */
  showInfoWindow(marker, country, data = {}) {
    // 기존 정보창 모두 닫기
    this.infoWindows.forEach((iw) => iw.close());

    const channels = data.channels || 0;
    const brands = data.brands || [];
    const customers = data.customers || [];

    const content = `
      <div style="padding: 10px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 10px 0; color: #1f77b4;">${country}</h3>
        <p style="margin: 5px 0;"><b>채널 수:</b> ${channels}</p>
        <p style="margin: 5px 0;"><b>브랜드:</b> ${brands.slice(0, 3).join(', ')}${brands.length > 3 ? '...' : ''}</p>
        <p style="margin: 5px 0;"><b>거래처:</b> ${customers.slice(0, 2).join(', ')}${customers.length > 2 ? '...' : ''}</p>
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content: content,
    });

    infoWindow.open(this.map, marker);
    this.infoWindows.push(infoWindow);
  }

  /**
   * 모든 마커 삭제
   */
  clearMarkers() {
    this.markers.forEach(({ marker }) => marker.setMap(null));
    this.markers = [];
    this.infoWindows.forEach((iw) => iw.close());
    this.infoWindows = [];
  }

  /**
   * 특정 국가로 지도 이동 및 마커 선택
   * @param {string} country - 국가명
   */
  focusCountry(country) {
    const coords = this.countryCoords[country];
    if (!coords) return false;

    this.map.panTo(coords);
    this.map.setZoom(5);

    // 해당 마커 클릭
    const markerData = this.markers.find((m) => m.country === country);
    if (markerData) {
      google.maps.event.trigger(markerData.marker, 'click');
    }

    return true;
  }

  /**
   * 지도 전체 리셋 (초기 상태로)
   */
  resetView() {
    const centerLat = 54.5260;
    const centerLng = 15.2551;
    this.map.panTo({ lat: centerLat, lng: centerLng });
    this.map.setZoom(3.5);
    this.infoWindows.forEach((iw) => iw.close());
    this.infoWindows = [];
  }

  /**
   * 지도 렌더링 완료 확인
   * @returns {boolean} 지도 초기화 여부
   */
  isInitialized() {
    return this.map !== null;
  }

  /**
   * 지도 크기 조정 (반응형)
   */
  resize() {
    if (this.map) {
      google.maps.event.trigger(this.map, 'resize');
    }
  }
}

// 전역 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapsModule;
}
