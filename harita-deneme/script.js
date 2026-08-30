document.addEventListener('DOMContentLoaded', () => {
    const haritaAlani = document.getElementById('harita-alani');
    const isimAlani = document.getElementById('bolge-ismi');
    
    // YENİ EKLENEN KISIM: HTML'deki menü elemanlarını seçiyoruz
    const renkSecici = document.getElementById('renk-secici');
    const kalinlikSecici = document.getElementById('kalinlik-secici');
    const kalinlikDeger = document.getElementById('kalinlik-deger');
    const root = document.documentElement; // CSS değişkenlerini değiştirmek için

    // Renk seçicide renk değiştiği an bu çalışır
    renkSecici.addEventListener('input', (e) => {
        root.style.setProperty('--hover-renk', e.target.value);
    });

    // Kalınlık çubuğunda değer değiştiği an bu çalışır
    kalinlikSecici.addEventListener('input', (e) => {
        const yeniKalinlik = e.target.value + 'px';
        kalinlikDeger.textContent = yeniKalinlik; // Ekranda sayıyı günceller
        root.style.setProperty('--sinir-kalinligi', yeniKalinlik); // Haritadaki kalınlığı günceller
    });

    // Haritayı yükleme kısmı (Aynı kaldı)
    fetch('turkiye_harita.svg')
        .then(cevap => cevap.text())
        .then(svgKodu => {
            haritaAlani.innerHTML = svgKodu;

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
        .catch(hata => {
            isimAlani.textContent = "Harita yüklenirken bir hata oluştu!";
            console.error('Harita yüklenemedi:', hata);
        });
});
