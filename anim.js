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

    const BASE_W = 180;
    const BASE_H = 240;

    const ALBUM_W = 150;
    const ALBUM_H = 105;

    const GAP_X = 220;
    const GAP_Y = 170;

    let items = [];
    let mode = "page1";
    let currentPage = 1;

    let speed = 1;
    let locked = false;
    let wishIndex = 0;

    let scrollSpeed = 2;
    let lastTime = performance.now();

    let albumRows = 0;
    let albumGapY = 0;

    function setBodyMode(name) {
        document.body.className = `state-${name}`;
    }

    function showPage(pageEl, pageNumber) {
        [page1, page2, page3].forEach(el => el.classList.remove("active"));
        pageEl.classList.add("active");
        currentPage = pageNumber;
    }

    function renderWish(index) {
        if (!wishes || !wishes.length) {
            wishText.textContent = "";
            wishFrom.textContent = "";
            return;
        }

        const item = wishes[index];

        if (typeof item === "string") {
            wishText.textContent = item;
            wishFrom.textContent = "";
            return;
        }

        wishText.textContent = item.text ?? "";
        wishFrom.textContent = item.from ? `— ${item.from}` : "";
    }

    function applyCardSize(type) {
        const w = type === "page2" ? ALBUM_W : BASE_W;
        const h = type === "page2" ? ALBUM_H : BASE_H;

        items.forEach(o => {
            o.el.style.width = `${w}px`;
            o.el.style.height = `${h}px`;
        });
    }

    function createItems() {
        bg.innerHTML = "";
        items = [];

        if (!images || !images.length) return;

        const cols = Math.ceil(window.innerWidth / GAP_X) + 4;
        const rows = 30;
        const total = cols * rows;

        for (let i = 0; i < total; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const src = images[i % images.length];

            const x = (col * GAP_X) - GAP_X;
            const y = (row * GAP_Y) - GAP_Y;
            const r = -18 + ((i % 7) * 6);

            const el = document.createElement("img");
            el.src = src;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.transform = `rotate(${r}deg)`;

            bg.appendChild(el);

            items.push({
                el,
                x,
                y,
                tx: x,
                ty: y,
                baseRow: row,
                r,
                tr: r,
                vx: 0,
                vy: 0
            });
        }
    }

    function layoutPage1Targets() {
        const cols = Math.ceil(window.innerWidth / GAP_X) + 4;

        items.forEach((o, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = (col * GAP_X) - GAP_X;
            const y = (row * GAP_Y) - GAP_Y;
            const r = -18 + ((i % 7) * 6);

            o.tx = x;
            o.ty = y;
            o.tr = r;

            o.vx = 1;
            o.vy = -1;
        });

        mode = "page1";
    }

    function layoutAlbumTargets() {
        const padX = 40;
        const padTop = 78;
        const gapX = 18;
        const gapY = 18;

        albumGapY = gapY;

        const usable = window.innerWidth - (padX * 2);
        const cols = Math.max(2, Math.floor(usable / (ALBUM_W + gapX)));

        albumRows = Math.ceil(items.length / cols);

        const totalWidth = cols * ALBUM_W + (cols - 1) * gapX;
        const startX = Math.max(20, Math.floor((window.innerWidth - totalWidth) / 2));

        items.forEach((o, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            o.tx = startX + col * (ALBUM_W + gapX);
            o.ty = padTop + row * (ALBUM_H + gapY);
            o.baseRow = row;
            o.tr = 0;
            o.vx = 0;
            o.vy = 0;
        });

        mode = "page2";
    }

    function layoutSplitTargets() {
        const half = Math.ceil(items.length / 2);
        const leftX = 24;
        const rightX = Math.max(window.innerWidth - BASE_W - 24, Math.floor(window.innerWidth * 0.62));
        const startY = 52;
        const stepY = 24;

        items.forEach((o, i) => {
            const isLeft = i < half;
            const localIndex = isLeft ? i : i - half;

            o.tx = isLeft ? leftX : rightX;
            o.ty = startY + localIndex * stepY;
            o.tr = isLeft ? -10 : 10;
            o.vx = isLeft ? -0.35 : 0.35;
            o.vy = 0.15;
        });

        mode = "page3";
    }

    function animate(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.033);
        lastTime = now;

        items.forEach(o => {
            if (mode === "page1") {
                o.x += 1.2 * speed * dt * 60;
                o.y -= 1.2 * speed * dt * 60;

                if (o.x > window.innerWidth + BASE_W) o.x = -BASE_W;
                if (o.y < -BASE_H) o.y = window.innerHeight + BASE_H;

                o.r += 0.03 * speed * dt * 60;
            }
            else if (mode === "to2") {
                o.x += (o.tx - o.x) * 0.08;
                o.y += (o.ty - o.y) * 0.08;
                o.r += (o.tr - o.r) * 0.08;
            }
            else if (mode === "page2") {
                o.x = o.tx;
                o.y += scrollSpeed * dt * 60;

                const totalHeight = albumRows * (ALBUM_H + albumGapY);

                if (o.y > window.innerHeight + ALBUM_H) {
                    o.y -= totalHeight;
                }

                o.r = 0;
            }
            else if (mode === "to1") {
                o.x += (o.tx - o.x) * 0.08;
                o.y += (o.ty - o.y) * 0.08;
                o.r += (o.tr - o.r) * 0.08;
            }
            else if (mode === "page3") {
                o.x += (o.tx - o.x) * 0.08;
                o.y += (o.ty - o.y) * 0.08;
                o.r += (o.tr - o.r) * 0.08;

                o.x += o.vx * dt * 60;
                o.y += o.vy * dt * 60;
            }

            o.el.style.left = `${o.x}px`;
            o.el.style.top = `${o.y}px`;
            o.el.style.transform = `rotate(${o.r}deg)`;
        });

        requestAnimationFrame(animate);
    }

    function toPage2() {
        if (locked) return;
        locked = true;

        speed = 5;
        setBodyMode("to2");

        applyCardSize("page2");
        layoutAlbumTargets();

        mode = "to2";

        setTimeout(() => {
            showPage(page2, 2);
            setBodyMode("page2");
            mode = "page2";
            speed = 1;
            locked = false;
        }, 900);
    }

    function toPage3() {
        if (locked) return;
        locked = true;

        applyCardSize("page1");
        layoutSplitTargets();

        showPage(page3, 3);
        setBodyMode("page3");
        mode = "page3";

        renderWish(wishIndex);

        setTimeout(() => {
            locked = false;
        }, 300);
    }

    function toPage1() {
        if (locked) return;
        locked = true;

        speed = 4;
        setBodyMode("to1");

        applyCardSize("page1");
        layoutPage1Targets();

        items.forEach(o => {
            o.vx = 0;
            o.vy = 0;
        });

        mode = "to1";

        setTimeout(() => {
            showPage(page1, 1);
            setBodyMode("page1");
            mode = "page1";
            speed = 1;
            wishIndex = 0;
            renderWish(0);
            locked = false;
        }, 700);
    }

    startBtn?.addEventListener("click", toPage2);
    to3Btn?.addEventListener("click", toPage3);

    nextBtn?.addEventListener("click", () => {
        if (locked) return;

        if (wishes && wishIndex < wishes.length - 1) {
            wishIndex++;
            renderWish(wishIndex);
        } else {
            toPage1();
        }
    });

    createItems();
    applyCardSize("page1");
    layoutPage1Targets();
    showPage(page1, 1);
    setBodyMode("page1");
    renderWish(0);
    requestAnimationFrame(animate);

    window.addEventListener("resize", () => {
        createItems();

        if (currentPage === 1) {
            applyCardSize("page1");
            layoutPage1Targets();
        } else if (currentPage === 2) {
            applyCardSize("page2");
            layoutAlbumTargets();
        } else {
            applyCardSize("page1");
            layoutSplitTargets();
        }
    });
});