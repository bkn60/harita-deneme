document.addEventListener('DOMContentLoaded', () => {
    const haritaAlani = document.getElementById('harita-alani');
    const isimAlani = document.getElementById('bolge-ismi');
    
    const renkSecici = document.getElementById('renk-secici');
    const kalinlikSecici = document.getElementById('kalinlik-secici');
    const kalinlikDeger = document.getElementById('kalinlik-deger');
    const sifirlaBtn = document.getElementById('sifirla-btn');
    const indirBtn = document.getElementById('indir-btn');
    const root = document.documentElement; 

    // Orijinal rengi geri yükleyen yardımcı fonksiyon
    function orijinalRengeDondur(parca) {
        const orijinalFill = parca.getAttribute('data-orijinal-fill');
        if (orijinalFill) {
            parca.style.fill = orijinalFill;
        } else {
            parca.style.removeProperty('fill');
        }
        parca.removeAttribute('data-boyali');
    }

    // Renk seçici
    if (renkSecici) {
        renkSecici.addEventListener('input', (e) => {
            root.style.setProperty('--hover-renk', e.target.value);
        });
    }

    // Kalınlık çubuğu
    if (kalinlikSecici) {
        kalinlikSecici.addEventListener('input', (e) => {
            const yeniKalinlik = e.target.value + 'px';
            kalinlikDeger.textContent = yeniKalinlik; 
            root.style.setProperty('--sinir-kalinligi', yeniKalinlik); 
        });
    }

    // 1. HARİTAYI SIFIRLA BUTONU
    if (sifirlaBtn) {
        sifirlaBtn.addEventListener('click', () => {
            const boyaliParcalar = haritaAlani.querySelectorAll('svg path');
            boyaliParcalar.forEach(parca => {
                orijinalRengeDondur(parca);
            });
            isimAlani.textContent = "Harita orijinal haline döndürüldü!";
            setTimeout(() => {
                isimAlani.textContent = "Bölge adını görmek için haritanın üzerine gelin";
            }, 1500);
        });
    }

    // 2. PNG İNDİR BUTONU
    if (indirBtn) {
        indirBtn.addEventListener('click', () => {
            const svgElement = haritaAlani.querySelector('svg');
            if (!svgElement) {
                alert("Harita henüz yüklenmedi!");
                return;
            }
            haritayiPngIndir(svgElement);
        });
    }

    // Haritayı yükle
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
                // Harita ilk yüklendiğinde her parçanın kendi orijinal rengini kaydet
                const mevcutInlineFill = path.style.fill || path.getAttribute('fill') || '';
                if (mevcutInlineFill) {
                    path.setAttribute('data-orijinal-fill', mevcutInlineFill);
                }

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
                            // Aynı renkle tekrar tıklandığında da siyaha değil orijinal rengine döner
                            orijinalRengeDondur(parca);
                        } else {
                            parca.style.setProperty('fill', seciliRenk, 'important');
                            parca.setAttribute('data-boyali', seciliRenk);
                        }
                    });
                });
            });

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
        const kalinlik = kalinlikSecici ? kalinlikSecici.value + 'px' : '0.8px';

        klonSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

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

        const rect = svgElement.getBoundingClientRect();
        const oran = (rect.height && rect.width) ? (rect.height / rect.width) : 0.45;
        const genislik = 2000;
        const yukseklik = Math.round(genislik * oran);

        klonSvg.setAttribute("width", genislik);
        klonSvg.setAttribute("height", yukseklik);

        const svgVerisi = new XMLSerializer().serializeToString(klonSvg);
        const svgBase64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgVerisi)));

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = genislik;
            canvas.height = yukseklik;
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(0, 0, genislik, yukseklik);
            ctx.drawImage(img, 0, 0, genislik, yukseklik);

            const indirmeLinki = document.createElement("a");
            indirmeLinki.download = "turkiye-haritasi.png";
            indirmeLinki.href = canvas.toDataURL("image/png");
            document.body.appendChild(indirmeLinki);
            indirmeLinki.click();
            document.body.removeChild(indirmeLinki);
        };
        img.onerror = (err) => {
            alert("Görsel oluşturulurken bir hata oluştu.");
            console.error(err);
        };
        img.src = svgBase64;
    }
});
