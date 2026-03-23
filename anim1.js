document.addEventListener("DOMContentLoaded", () => {
    const bg = document.getElementById("bg");

    const startBtn = document.getElementById("start");
    const to3Btn = document.getElementById("to3");
    const nextBtn = document.getElementById("next");

    const page1 = document.getElementById("page1");
    const page2 = document.getElementById("page2");
    const page3 = document.getElementById("page3");

    const wishText = document.getElementById("wishText");
    const wishFrom = document.getElementById("wishFrom");

    let items = [];
    let mode = "page1"; // page1, to2, page2, page3, to1
    let speed = 1;
    let locked = false;
    let wishIndex = 0;

    let page2Speed = 0.8;
    let lastTime = performance.now();

    let page2Cols = 0;
    let page2StepY = 0;
    let page2Columns = [];
    let page2ItemW = 0;
    let page2ItemH = 0;

    function getSizes() {
        const mobile = window.innerWidth < 700;
        return {
            mobile,
            BASE_W: mobile ? 100 : 180,
            BASE_H: mobile ? 140 : 240,
            ALBUM_W: mobile ? 80 : 150,
            ALBUM_H: mobile ? 60 : 105,
            GAP_X: mobile ? 140 : 220,
            GAP_Y: mobile ? 120 : 170
        };
    }

    function showPage(p) {
        [page1, page2, page3].forEach(el => el.classList.remove("active"));
        p.classList.add("active");
    }

    function renderWish(i) {
        if (!wishes || !wishes.length) {
            wishText.textContent = "";
            wishFrom.textContent = "";
            return;
        }

        const w = wishes[i];

        if (typeof w === "string") {
            wishText.textContent = w;
            wishFrom.textContent = "";
            return;
        }

        wishText.textContent = w.text || "";
        wishFrom.textContent = w.from ? "— " + w.from : "";
    }

    function createItems() {
        const S = getSizes();

        bg.innerHTML = "";
        items = [];

        if (!images || !images.length) return;

        const extra = S.mobile ? 2 : 3;
        const cols = Math.ceil(window.innerWidth / S.GAP_X) + extra;
        const rows = S.mobile ? 28 : 24;
        const total = cols * rows;

        for (let i = 0; i < total; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = col * S.GAP_X - S.GAP_X;
            const y = row * S.GAP_Y - S.GAP_Y;
            const r = -15 + (i % 5) * 6;

            const img = document.createElement("img");
            img.src = images[i % images.length];
            img.style.width = S.BASE_W + "px";
            img.style.height = S.BASE_H + "px";
            img.style.left = x + "px";
            img.style.top = y + "px";
            img.style.position = "absolute";
            img.style.objectFit = "cover";
            img.style.transform = `rotate(${r}deg)`;

            bg.appendChild(img);

            items.push({
                el: img,
                x,
                y,
                tx: x,
                ty: y,
                r,
                tr: r,
                vx: 0,
                vy: 0,
                col,
                row
            });
        }
    }

    function resetToPage1Positions() {
        const S = getSizes();
        const cols = Math.ceil(window.innerWidth / S.GAP_X) + (S.mobile ? 2 : 3);

        items.forEach((o, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = col * S.GAP_X - S.GAP_X;
            const y = row * S.GAP_Y - S.GAP_Y;
            const r = -15 + (i % 5) * 6;

            o.x = x;
            o.y = y;
            o.r = r;

            o.tx = x;
            o.ty = y;
            o.tr = r;

            o.vx = 0;
            o.vy = 0;

            o.el.style.left = o.x + "px";
            o.el.style.top = o.y + "px";
            o.el.style.transform = `rotate(${o.r}deg)`;
        });

        mode = "page1";
    }

    function layoutPage1() {
        const S = getSizes();
        const cols = Math.ceil(window.innerWidth / S.GAP_X) + (S.mobile ? 2 : 3);

        items.forEach((o, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            o.tx = col * S.GAP_X - S.GAP_X;
            o.ty = row * S.GAP_Y - S.GAP_Y;
            o.tr = -15 + (i % 5) * 6;
            o.vx = 1;
            o.vy = -1;
        });

        mode = "page1";
    }

    function layoutPage2() {
        const S = getSizes();

        const padX = S.mobile ? 12 : 20;
        const padTop = S.mobile ? 92 : 120;
        const gapX = S.mobile ? 18 : 34;
        const gapY = S.mobile ? 18 : 34;

        // mobile dipaksa 2 kolom biar tidak padat
        const cols = S.mobile ? 2 : Math.max(2, Math.floor((window.innerWidth - (padX * 2) + gapX) / (S.ALBUM_W + gapX)));

        page2Cols = cols;
        page2Columns = Array.from({ length: cols }, () => []);

        // ukuran tile page2
        page2ItemW = S.mobile
            ? Math.floor((window.innerWidth - (padX * 2) - gapX) / 2)
            : S.ALBUM_W;

        page2ItemH = S.mobile
            ? Math.round(page2ItemW * 1.12)
            : S.ALBUM_H;

        const totalWidth = cols * page2ItemW + (cols - 1) * gapX;
        const startX = Math.max(padX, Math.floor((window.innerWidth - totalWidth) / 2));

        items.forEach((o, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            o.col = col;
            o.row = row;

            o.el.style.width = page2ItemW + "px";
            o.el.style.height = page2ItemH + "px";

            o.tx = startX + col * (page2ItemW + gapX);
            o.ty = padTop + row * (page2ItemH + gapY);
            o.tr = 0;

            o.vx = 0;
            o.vy = 0;

            page2Columns[col].push(i);
        });

        page2StepY = page2ItemH + gapY;
        mode = "to2";
    }

    function layoutPage3() {
        const S = getSizes();
        const half = Math.ceil(items.length / 2);

        items.forEach((o, i) => {
            if (i < half) {
                o.tx = 20;
                o.ty = 40 + i * 20;
                o.tr = -10;
            } else {
                const k = i - half;
                o.tx = window.innerWidth - S.BASE_W - 20;
                o.ty = 40 + k * 20;
                o.tr = 10;
            }

            o.vx = 0;
            o.vy = 0;
        });

        mode = "page3";
    }

    function animate(now) {
        const S = getSizes();
        const dt = Math.min((now - lastTime) / 1000, 0.033);
        lastTime = now;

        if (mode === "page2") {
            const topYByCol = Array(page2Cols).fill(Infinity);

            for (let i = 0; i < items.length; i++) {
                const o = items[i];

                o.x = o.tx;
                o.y += page2Speed * dt * 60;

                if (o.y < topYByCol[o.col]) {
                    topYByCol[o.col] = o.y;
                }

                o.r = 0;
            }

            const limit = window.innerHeight + page2ItemH + page2StepY;

            for (let c = 0; c < page2Cols; c++) {
                const list = page2Columns[c];
                if (!list || !list.length) continue;

                for (let k = list.length - 1; k >= 0; k--) {
                    const idx = list[k];
                    const o = items[idx];

                    if (o.y > limit) {
                        o.y = topYByCol[c] - page2StepY;
                        topYByCol[c] = o.y;
                    }
                }
            }
        } else {
            items.forEach(o => {
                if (mode === "page1") {
                    o.x += 0.5 * speed * dt * 60;
                    o.y -= 0.5 * speed * dt * 60;

                    if (o.x > window.innerWidth + S.BASE_W) o.x = -S.BASE_W;
                    if (o.y < -S.BASE_H) o.y = window.innerHeight + S.BASE_H;

                    o.r += 0.02 * dt * 60;
                } else if (mode === "to2") {
                    o.x += (o.tx - o.x) * 0.07;
                    o.y += (o.ty - o.y) * 0.07;
                    o.r += (o.tr - o.r) * 0.07;
                } else if (mode === "to1") {
                    o.x += (o.tx - o.x) * 0.07;
                    o.y += (o.ty - o.y) * 0.07;
                    o.r += (o.tr - o.r) * 0.07;
                } else if (mode === "page3") {
                    o.x += (o.tx - o.x) * 0.07;
                    o.y += (o.ty - o.y) * 0.07;
                    o.r += (o.tr - o.r) * 0.07;

                    o.x += o.vx * dt * 60;
                    o.y += o.vy * dt * 60;
                }
            });
        }

        items.forEach(o => {
            o.el.style.left = o.x + "px";
            o.el.style.top = o.y + "px";
            o.el.style.transform = `rotate(${o.r}deg)`;
        });

        requestAnimationFrame(animate);
    }

    function goPage2() {
        if (locked) return;
        locked = true;

        speed = 2;
        layoutPage2();
        showPage(page2);

        setTimeout(() => {
            locked = false;
            speed = 1;
            mode = "page2";
        }, 300);
    }

    function goPage3() {
        if (locked) return;
        locked = true;

        layoutPage3();
        showPage(page3);
        renderWish(wishIndex);

        setTimeout(() => {
            locked = false;
            mode = "page3";
        }, 300);
    }

    function goPage1() {
        if (locked) return;
        locked = true;

        speed = 2;
        layoutPage1();
        mode = "to1";

        setTimeout(() => {
            resetToPage1Positions();
            showPage(page1);
            wishIndex = 0;
            renderWish(0);

            speed = 1;
            locked = false;
        }, 900);
    }

    startBtn?.addEventListener("click", goPage2);
    to3Btn?.addEventListener("click", goPage3);

    nextBtn?.addEventListener("click", () => {
        if (locked) return;

        if (wishes && wishIndex < wishes.length - 1) {
            wishIndex++;
            renderWish(wishIndex);
        } else {
            goPage1();
        }
    });

    createItems();
    resetToPage1Positions();
    showPage(page1);
    renderWish(0);
    requestAnimationFrame(animate);

    window.addEventListener("resize", () => {
        createItems();
        resetToPage1Positions();
        showPage(page1);
        wishIndex = 0;
        renderWish(0);
        speed = 1;
        locked = false;
    });
});