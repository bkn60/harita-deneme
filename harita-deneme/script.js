document.addEventListener('DOMContentLoaded', () => {
    const haritaAlani = document.getElementById('harita-alani');
    const isimAlani = document.getElementById('bolge-ismi');
    
    const renkSecici = document.getElementById('renk-secici');
    const kalinlikSecici = document.getElementById('kalinlik-secici');
    const kalinlikDeger = document.getElementById('kalinlik-deger');
    const root = document.documentElement; 

    // Renk seçici değiştiğinde
    renkSecici.addEventListener('input', (e) => {
        root.style.setProperty('--hover-renk', e.target.value);
    });

    // Kalınlık çubuğu değiştiğinde
    kalinlikSecici.addEventListener('input', (e) => {
        const yeniKalinlik = e.target.value + 'px';
        kalinlikDeger.textContent = yeniKalinlik; 
        root.style.setProperty('--sinir-kalinligi', yeniKalinlik); 
    });

    // Haritayı yükleme kısmı
    fetch('turkiye_harita.svg')
        .then(cevap => {
            // Eğer dosya bulunamazsa (örn: klasör sorunu yüzünden) sessizce kalmasın, hata versin
            if (!cevap.ok) throw new Error("SVG dosyası bulunamadı!");
            return cevap.text();
        })
        .then(svgKodu => {
            haritaAlani.innerHTML = svgKodu;

            // ---> İŞTE BURAYI UNUTMUŞTUK! Harita yüklenince yazıyı düzelt:
            isimAlani.textContent = "Bölge adını görmek için haritanın üzerine gelin";

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
            isimAlani.textContent = "HATA: Harita bulunamadı! (turkiye_harita.svg aynı klasörde mi?)";
            console.error('Hata detayı:', hata);
        });
});
