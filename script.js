"use strict";

/* =========================================================
   KONFIGURASI — GANTI BAGIAN INI SESUAI DATA KAMU
   ========================================================= */
const CONFIG = {
  // Nomor WhatsApp pemilik jasa, format internasional TANPA tanda + atau 0 di depan
  WA_NUMBER: "6283874632003",
  DEFAULT_MESSAGE: "Halo, saya ingin tanya-tanya soal jasa Survey Kos & Cari Kos RaraKos (khusus Jabodetabek)."
};

const SURVEY_PACKAGES = [
  { value: "survey1", label: "Survey 1 Kos — Rp25.000" },
  { value: "survey3", label: "Survey 3 Kos — Rp55.000" },
  { value: "survey5", label: "Survey 5 Kos — Rp75.000" }
];

const CARIKOS_PACKAGES = [
  { value: "basic", label: "Basic — Rp65.000" },
  { value: "standar", label: "Standar — Rp100.000" },
  { value: "premium", label: "Premium — Rp130.000" },
  { value: "lengkap", label: "Paket Lengkap (Cari + Survey) — Rp150.000" },
  { value: "express12", label: "Express 12 Jam — Rp200.000" },
  { value: "express6", label: "Express 6 Jam — Rp250.000" }
];

const PACKAGE_MESSAGES = {
  survey1: "Halo, saya tertarik pakai jasa SURVEY 1 KOS (Rp25.000). Boleh dibantu prosesnya?",
  survey3: "Halo, saya tertarik pakai jasa SURVEY 3 KOS (Rp55.000). Boleh dibantu prosesnya?",
  survey5: "Halo, saya tertarik pakai jasa SURVEY 5 KOS (Rp75.000). Boleh dibantu prosesnya?",
  basic: "Halo, saya tertarik pakai jasa Cari Kos paket BASIC (Rp65.000). Boleh dibantu prosesnya?",
  standar: "Halo, saya tertarik pakai jasa Cari Kos paket STANDAR (Rp100.000). Boleh dibantu prosesnya?",
  premium: "Halo, saya tertarik pakai jasa Cari Kos paket PREMIUM (Rp130.000). Boleh dibantu prosesnya?",
  lengkap: "Halo, saya tertarik pakai PAKET LENGKAP: Cari Kos + Survey 1 Lokasi (Rp150.000). Boleh dibantu prosesnya?",
  express12: "Halo, saya tertarik pakai jasa Cari Kos paket EXPRESS 12 JAM (Rp200.000). Boleh dibantu prosesnya?",
  express6: "Halo, saya tertarik pakai jasa Cari Kos paket EXPRESS 6 JAM (Rp250.000). Boleh dibantu prosesnya?",
  halo: null // pakai DEFAULT_MESSAGE
};

/**
 * Sanitasi teks masukan pengguna sebelum dipakai membangun pesan WhatsApp.
 * Bukan cuma soal tampilan: ini mencegah karakter kontrol/markup aneh
 * ikut terbawa ke URL yang dibuka di tab baru.
 */
function sanitizeInput(str) {
  if (!str) return "";
  return String(str)
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 400);
}

function openWhatsApp(message) {
  const text = encodeURIComponent(sanitizeInput(message) || CONFIG.DEFAULT_MESSAGE);
  const url = `https://wa.me/${CONFIG.WA_NUMBER}?text=${text}`;
  // noopener + noreferrer: mencegah tab baru mengakses window.opener (tabnabbing)
  window.open(url, "_blank", "noopener,noreferrer");
}

// Tombol-tombol WA generik (nav, hero, harga, footer, dsb.)
document.querySelectorAll("[data-wa]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const key = el.getAttribute("data-wa-msg");
    const msg = Object.prototype.hasOwnProperty.call(PACKAGE_MESSAGES, key)
      ? PACKAGE_MESSAGES[key]
      : null;
    openWhatsApp(msg);
  });
});

document.getElementById("floatWaBtn").addEventListener("click", () => {
  openWhatsApp();
});

/* ---------- Form booking dinamis ---------- */
const fLayanan = document.getElementById("fLayanan");
const fPaket = document.getElementById("fPaket");
const fDetail = document.getElementById("fDetail");
const fDetailLabel = document.getElementById("fDetailLabel");

function populatePaketOptions(layanan) {
  const list = layanan === "carikos" ? CARIKOS_PACKAGES : SURVEY_PACKAGES;
  fPaket.innerHTML = "";
  list.forEach((pkg) => {
    const opt = document.createElement("option");
    opt.value = pkg.value;
    opt.textContent = pkg.label;
    fPaket.appendChild(opt);
  });
}

function updateFormForLayanan() {
  const layanan = fLayanan.value;
  populatePaketOptions(layanan);
  if (layanan === "carikos") {
    fDetailLabel.textContent = "Lokasi diinginkan, budget, jenis kos, & fasilitas";
    fDetail.placeholder = "Contoh: dekat Stasiun Depok Baru, budget 1jt/bulan, kos putri, ada AC & KM dalam";
  } else {
    fDetailLabel.textContent = "Alamat / link kos yang ingin disurvey";
    fDetail.placeholder = "Contoh: Kos Melati, Jl. Margonda Raya, Depok";
  }
}

fLayanan.addEventListener("change", updateFormForLayanan);
updateFormForLayanan();

/* ---------- Submit form -> bangun pesan WA ---------- */
const bookingForm = document.getElementById("bookingForm");
const submitBtn = document.getElementById("submitBtn");

bookingForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // Honeypot: bot biasanya mengisi semua field tersembunyi, manusia tidak
  const honeypot = document.getElementById("fWebsite").value;
  if (honeypot) {
    return; // diam-diam batalkan, tanpa memberi tahu bot apa yang salah
  }

  const nama = sanitizeInput(document.getElementById("fNama").value);
  const hp = sanitizeInput(document.getElementById("fHp").value);
  const layananVal = fLayanan.value;
  const layananLabel = layananVal === "carikos" ? "Cari Kos" : "Survey Kos";
  const paketLabel = fPaket.options[fPaket.selectedIndex]
    ? fPaket.options[fPaket.selectedIndex].textContent
    : "";
  const detail = sanitizeInput(fDetail.value);
  const catatan = sanitizeInput(document.getElementById("fCatatan").value);

  if (!nama || !hp || !detail) {
    bookingForm.reportValidity();
    return;
  }

  let message = `Halo, saya ingin booking layanan RaraKos.\n\n`;
  message += `Nama: ${nama}\n`;
  message += `No. HP: ${hp}\n`;
  message += `Layanan: ${layananLabel}\n`;
  message += `Paket: ${paketLabel}\n`;
  message += `Detail: ${detail}\n`;
  if (catatan) message += `Catatan: ${catatan}\n`;

  // cegah klik ganda / submit berkali-kali saat tab WA sedang dibuka
  submitBtn.setAttribute("disabled", "true");
  openWhatsApp(message);
  window.setTimeout(() => submitBtn.removeAttribute("disabled"), 1500);
});

/* ---------- Menu mobile ---------- */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* ---------- FAQ accordion ---------- */
document.querySelectorAll(".faq-item").forEach((item) => {
  const q = item.querySelector(".faq-q");
  const a = item.querySelector(".faq-a");
  if (item.classList.contains("open")) {
    a.style.maxHeight = a.scrollHeight + "px";
  }
  q.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach((other) => {
      if (other !== item) {
        other.classList.remove("open");
        other.querySelector(".faq-a").style.maxHeight = null;
      }
    });
    if (isOpen) {
      item.classList.remove("open");
      a.style.maxHeight = null;
    } else {
      item.classList.add("open");
      a.style.maxHeight = a.scrollHeight + "px";
    }
  });
});

/* ---------- Reveal saat discroll (dimatikan untuk pengguna reduced-motion) ---------- */
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in"));
}
