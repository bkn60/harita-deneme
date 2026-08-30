// script.js - Sayfanın dinamik işlevleri
document.addEventListener('DOMContentLoaded', () => {
    const haritaAlani = document.getElementById('harita-alani');
    const isimAlani = document.getElementById('bolge-ismi');

    // 1. Dışarıdaki SVG dosyasını çekip HTML'in içine gömüyoruz
    fetch('turkiye_harita.svg')
        .then(cevap => cevap.text())
        .then(svgKodu => {
            // Çekilen kodları harita alanının içine yerleştir
            haritaAlani.innerHTML = svgKodu;

            // 2. Harita yüklendikten sonra bölgelere dinleyici (listener) ekliyoruz
            const paths = haritaAlani.querySelectorAll('svg path');
            
            paths.forEach(path => {
                path.addEventListener('mouseenter', () => {
                    let bolgeId = path.getAttribute('id');
                    
                    if (!bolgeId && path.parentElement.tagName.toLowerCase() === 'g') {
                        bolgeId = path.parentElement.getAttribute('id');
                    }

                    if (bolgeId) {
                        isimAlani.textContent = bolgeId;
                    }
                });

                path.addEventListener('mouseleave', () => {
                    isimAlani.textContent = "Bölge adını görmek için haritanın üzerine gelin";
                });
            });
        })
        .catch(hata => {
            isimAlani.textContent = "Harita yüklenirken bir hata oluştu!";
            console.error('Harita yüklenemedi:', hata);
        });
});