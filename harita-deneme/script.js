document.addEventListener('DOMContentLoaded', () => {
    const haritaAlani = document.getElementById('harita-alani');
    const isimAlani = document.getElementById('bolge-ismi');
    
    const renkSecici = document.getElementById('renk-secici');
    const kalinlikSecici = document.getElementById('kalinlik-secici');
    const kalinlikDeger = document.getElementById('kalinlik-deger');
    const sifirlaBtn = document.getElementById('sifirla-btn');
    const indirBtn = document.getElementById('indir-btn');
    const root = document.documentElement; 

    renkSecici.addEventListener('input', (e) => {
        root.style.setProperty('--hover-renk', e.target.value);
    });

    kalinlikSecici.addEventListener('input', (e) => {
        const yeniKalinlik = e.target.value + 'px';
        kalinlikDeger.textContent = yeniKalinlik; 
        root.style.setProperty('--sinir-kalinligi', yeniKalinlik); 
    });

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

            function ilAdiniBul(path) {
                if (path.getAttribute('id')) {
                    return path.getAttribute('id');
                }
                const parent = path.parentElement;
                if (parent && parent.tagName.toLowerCase() === 'g' && parent.getAttribute('id')) {
                    if (parent.querySelectorAll('path').length < 15) {
                        return parent.getAttribute('id');
                    }
                }
                return null;
            }

            const ilGruplari = {};
            paths.forEach(path => {
                const hamId = ilAdiniBul(path);
                if (!hamId) return;

                if (!ilGruplari[hamId]) {
                    ilGruplari[hamId] = [];
                }
                ilGruplari[hamId].push(path);

                path.addEventListener('mouseenter', () => {
                    isimAlani.textContent = hamId.replace(/[_-]/g, ' ');
                });

                path.addEventListener('mouseleave', () => {
                    isimAlani.textContent = "Bölge adını görmek için haritanın üzerine gelin";
                });

                path.addEventListener('click', () => {
                    const seciliRenk = renkSecici.value.toLowerCase();
                    const ilParcalari = ilGruplari[hamId];
                    const mevcutRenk = ilParcalari[0].getAttribute('data-boyali');

                    ilParcalari.forEach(parca => {
                        if (mevcutRenk === seciliRenk) {
                            parca.style.removeProperty('fill');
                            parca.removeAttribute('data-boyali');
                        } else {
                            parca.style.setProperty('fill', seciliRenk, 'important');
                            parca.setAttribute('data-boyali', seciliRenk);
                        }
                    });
                });
            });

            ilIsimleriniYazdir(svgElement, ilGruplari);

            // Haritayı Sıfırla Butonu
            sifirlaBtn.addEventListener('click', () => {
                paths.forEach(parca => {
                    parca.style.removeProperty('fill');
                    parca.removeAttribute('data-boyali');
                });
            });

            // Haritayı PNG Olarak İndir Butonu
            indirBtn.addEventListener('click', () => {
                haritayiPngIndir(svgElement);
            });
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

    function haritayiPngIndir(svgElement) {
        const klonSvg = svgElement.cloneNode(true);
        const kalinlik = kalinlikSecici.value + 'px';

        // CSS stillerini indirilecek görselin içine göm
        const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleEl.textContent = `
            path { stroke-width: ${kalinlik}; }
            .il-etiket {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 9px;
                font-weight: bold;
                fill: #111111;
                text-anchor: middle;
                dominant-baseline: central;
                paint-order: stroke;
                stroke: #ffffff;
                stroke-width: 2.5px;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
        `;
        klonSvg.insertBefore(styleEl, klonSvg.firstChild);

        const bbox = svgElement.getBoundingClientRect();
        const genislik = Math.max(bbox.width * 2, 1600);
        const yukseklik = Math.max(bbox.height * 2, 800);
        klonSvg.setAttribute("width", genislik);
        klonSvg.setAttribute("height", yukseklik);

        const svgVerisi = new XMLSerializer().serializeToString(klonSvg);
        const svgBlob = new Blob([svgVerisi], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = genislik;
            canvas.height = yukseklik;
            const ctx = canvas.getContext("2d");

            // Arka planı sayfa rengiyle doldur
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(0, 0, genislik, yukseklik);
            ctx.drawImage(img, 0, 0, genislik, yukseklik);
            URL.revokeObjectURL(url);

            const indirmeLinki = document.createElement("a");
            indirmeLinki.download = "turkiye-haritasi.png";
            indirmeLinki.href = canvas.toDataURL("image/png");
            indirmeLinki.click();
        };
        img.src = url;
    }
});
