document.addEventListener('DOMContentLoaded', () => {
    const haritaAlani = document.getElementById('harita-alani');
    const isimAlani = document.getElementById('bolge-ismi');
    
    const renkSecici = document.getElementById('renk-secici');
    const kalinlikSecici = document.getElementById('kalinlik-secici');
    const kalinlikDeger = document.getElementById('kalinlik-deger');
    const root = document.documentElement; 

    // Renk seçici değiştiğinde sadece yeni tıklamalar ve hover için rengi günceller
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
            const paths = Array.from(svgElement.querySelectorAll('path'));

            // Her path için gerçek il adını bul (kendi id'si veya sadece o ile ait üst <g> id'si)
            function ilAdiniBul(path) {
                if (path.getAttribute('id')) {
                    return path.getAttribute('id');
                }
                const parent = path.parentElement;
                // Üstteki <g> etiketi tüm haritayı değil (en fazla 15 parçayı) kapsıyorsa il grubudur
                if (parent && parent.tagName.toLowerCase() === 'g' && parent.getAttribute('id')) {
                    if (parent.querySelectorAll('path').length < 15) {
                        return parent.getAttribute('id');
                    }
                }
                return null;
            }

            // Aynı il adına sahip tüm parçaları (örn. İstanbul'un iki yakasını) eşleştir
            const ilGruplari = {};
            paths.forEach(path => {
                const hamId = ilAdiniBul(path);
                if (!hamId) return;

                if (!ilGruplari[hamId]) {
                    ilGruplari[hamId] = [];
                }
                ilGruplari[hamId].push(path);

                // Hover (Üzerine gelme)
                path.addEventListener('mouseenter', () => {
                    isimAlani.textContent = hamId.replace(/[_-]/g, ' ');
                });

                path.addEventListener('mouseleave', () => {
                    isimAlani.textContent = "Bölge adını görmek için haritanın üzerine gelin";
                });

                // Tıklama ile kalıcı boyama
                path.addEventListener('click', () => {
                    const seciliRenk = renkSecici.value.toLowerCase();
                    const ilParcalari = ilGruplari[hamId];
                    const mevcutRenk = ilParcalari[0].getAttribute('data-boyali');

                    ilParcalari.forEach(parca => {
                        if (mevcutRenk === seciliRenk) {
                            // Zaten aynı renge boyalıysa boyayı temizle
                            parca.style.removeProperty('fill');
                            parca.removeAttribute('data-boyali');
                        } else {
                            // Seçili renge kalıcı olarak boya
                            parca.style.setProperty('fill', seciliRenk, 'important');
                            parca.setAttribute('data-boyali', seciliRenk);
                        }
                    });
                });
            });

            // Harita üzerine il/bölge isimlerini yazdırma
            ilIsimleriniYazdir(svgElement, ilGruplari);
        })
        .catch(hata => {
            isimAlani.textContent = "HATA: Harita bulunamadı! (turkiye_harita.svg aynı klasörde mi?)";
            console.error('Hata detayı:', hata);
        });

    function ilIsimleriniYazdir(svgElement, ilGruplari) {
        const svgNS = "http://www.w3.org/2000/svg";
        const etiketGrubu = document.createElementNS(svgNS, "g");
        etiketGrubu.setAttribute("id", "harita-etiketleri");
        svgElement.appendChild(etiketGrubu);

        Object.entries(ilGruplari).forEach(([hamId, parcalar]) => {
            // Birden fazla parçalı illerde (İstanbul, Çanakkale vb.) en büyük parçanın merkezini bul
            let enBuyukBBox = null;
            let maxAlan = 0;

            parcalar.forEach(parca => {
                const bbox = parca.getBBox();
                const alan = bbox.width * bbox.height;
                if (alan > maxAlan) {
                    maxAlan = alan;
                    enBuyukBBox = bbox;
                }
            });

            if (!enBuyukBBox || maxAlan === 0) return;

            const centerX = enBuyukBBox.x + enBuyukBBox.width / 2;
            const centerY = enBuyukBBox.y + enBuyukBBox.height / 2;
            const gorunenIsim = hamId.replace(/[_-]/g, ' ');

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", centerX);
            text.setAttribute("y", centerY);
            text.setAttribute("class", "il-etiket");
            text.textContent = gorunenIsim;

            etiketGrubu.appendChild(text);
        });
    }
});
