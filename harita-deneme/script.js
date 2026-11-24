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
            if (!cevap.ok) throw new Error("SVG dosyası bulunamadı!");
            return cevap.text();
        })
        .then(svgKodu => {
            haritaAlani.innerHTML = svgKodu;
            isimAlani.textContent = "Bölge adını görmek için haritanın üzerine gelin";

            const svgElement = haritaAlani.querySelector('svg');
            const paths = svgElement.querySelectorAll('path');
            
            // 1. Hover (Üzerine gelme) olayları
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

            // 2. Harita üzerine il/bölge isimlerini kalıcı olarak yazdırma
            ilIsimleriniYazdir(svgElement);
        })
        .catch(hata => {
            isimAlani.textContent = "HATA: Harita bulunamadı! (turkiye_harita.svg aynı klasörde mi?)";
            console.error('Hata detayı:', hata);
        });

    function ilIsimleriniYazdir(svgElement) {
        const svgNS = "http://www.w3.org/2000/svg";
        const etiketGrubu = document.createElementNS(svgNS, "g");
        etiketGrubu.setAttribute("id", "harita-etiketleri");
        svgElement.appendChild(etiketGrubu);

        // Tekrar eden isimleri (örneğin İstanbul'un 2 yakası gibi) önlemek için kayıt tutalım
        const islenenIdler = new Set();
        const hedefler = svgElement.querySelectorAll('g[id], path[id]');

        hedefler.forEach(eleman => {
            const id = eleman.getAttribute('id');
            
            // Geçersiz, kapsayıcı veya daha önce yazılmış ID'leri atla
            if (!id || id === "harita-etiketleri" || id.startsWith("layer") || islenenIdler.has(id)) {
                return;
            }

            // Eğer bu eleman bir <path> ise ve üstündeki <g> etiketinin zaten bir id'si varsa, 
            // yazıyı <g> etiketi üzerinden ortalamak için bu <path>'i atla
            if (eleman.tagName.toLowerCase() === 'path' && 
                eleman.parentElement.tagName.toLowerCase() === 'g' && 
                eleman.parentElement.getAttribute('id')) {
                return;
            }

            const bbox = eleman.getBBox();
            if (bbox.width === 0 || bbox.height === 0) return;

            islenenIdler.add(id);

            // Kutunun tam merkezini bul
            let centerX = bbox.x + bbox.width / 2;
            let centerY = bbox.y + bbox.height / 2;

            // Alt çizgi (_) veya tire (-) varsa boşlukla değiştir (ör: "Istanbul_1" -> "Istanbul 1")
            const gorunenIsim = id.replace(/[_-]/g, ' ');

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", centerX);
            text.setAttribute("y", centerY);
            text.setAttribute("class", "il-etiket");
            text.textContent = gorunenIsim;

            etiketGrubu.appendChild(text);
        });
    }
});
