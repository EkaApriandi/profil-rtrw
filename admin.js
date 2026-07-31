// Ganti dengan URL Vercel Anda yang sebenarnya agar scan QR mengarah ke web yang benar!
const BASE_PUBLIC_URL = 'https://profil-rtrw.vercel.app/'; 

const SUPABASE_URL = 'https://zpskuqsmnsrolbnvmrvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwc2t1cXNtbnNyb2xibnZtcnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDg4MTAsImV4cCI6MjEwMDcyNDgxMH0.e6ic19bbKP0BorQEiIzjKe3xtRfvXM0rRqEdY25zKcg';

// Inisialisasi Klien Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let daftarPengurus = [];
let modeForm = 'edit';
let currentFotoUrl = ''; 
let qrcodeInstance = null; // Variabel untuk menyimpan instansi QR Code

// Fungsi UX Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = `show ${type}`;
    setTimeout(() => { toast.className = toast.className.replace(`show ${type}`, ""); }, 3000);
}

// Cek sesi saat halaman dimuat
window.onload = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) tampilkanDashboard();
};

async function login() {
    const btn = document.getElementById('btn-login');
    btn.innerText = "Memeriksa...";
    btn.disabled = true;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        showToast("Login gagal. Periksa kembali kredensial Anda.", "error");
        btn.innerText = "Masuk";
        btn.disabled = false;
    } else {
        showToast("Berhasil login!");
        tampilkanDashboard();
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    location.reload();
}

function tampilkanDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    muatDataPengurus();
}

async function muatDataPengurus() {
    const { data, error } = await supabaseClient.from('pengurus').select('*').order('id', { ascending: true });
    if (error) { showToast("Gagal memuat data!", "error"); return; }
    
    daftarPengurus = data;
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    data.forEach(p => {
        const tr = document.createElement('tr');
        // Bagian ini diperbarui untuk menambahkan tombol QR Code
        tr.innerHTML = `
            <td><strong>${p.id}</strong></td>
            <td>${p.nama || '-'}</td>
            <td>${p.jabatan || '-'}</td>
            <td style="display: flex; gap: 5px;">
                <button class="btn-small" onclick="bukaModalEdit('${p.id}')">Edit</button>
                <button class="btn-small btn-danger" onclick="hapusData('${p.id}')">Hapus</button>
                <button class="btn-small" style="background-color: #10b981; color: white;" onclick="bukaModalQR('${p.id}', '${p.nama || p.id}')">QR Code</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function bukaModalTambah() {
    modeForm = 'tambah';
    currentFotoUrl = '';
    document.getElementById('modal-title').innerText = 'Tambah Data Pengurus';
    document.getElementById('edit-id').value = '';
    document.getElementById('edit-id').readOnly = false;
    document.getElementById('edit-nama').value = '';
    document.getElementById('edit-jabatan').value = '';
    document.getElementById('edit-masa').value = '';
    document.getElementById('edit-nohp').value = '';
    document.getElementById('edit-deskripsi').value = '';
    document.getElementById('edit-foto').value = '';
    document.getElementById('edit-modal').style.display = 'flex';
}

function bukaModalEdit(id) {
    modeForm = 'edit';
    const p = daftarPengurus.find(item => item.id == id);
    if (!p) return;
    currentFotoUrl = p.foto_url || '';
    document.getElementById('modal-title').innerText = 'Edit Data Pengurus';
    document.getElementById('edit-id').value = p.id;
    document.getElementById('edit-id').readOnly = true;
    document.getElementById('edit-nama').value = p.nama || '';
    document.getElementById('edit-jabatan').value = p.jabatan || '';
    document.getElementById('edit-masa').value = p.masa_jabatan || '';
    document.getElementById('edit-nohp').value = p.no_hp || '';
    document.getElementById('edit-deskripsi').value = p.deskripsi_tugas || '';
    document.getElementById('edit-foto').value = ''; 
    document.getElementById('edit-modal').style.display = 'flex';
}

function tutupModal() { 
    document.getElementById('edit-modal').style.display = 'none'; 
}

async function simpanData() {
    const idInput = document.getElementById('edit-id').value.trim();
    
    // Validasi Regex untuk ID
    const idRegex = /^[A-Z0-9-]+$/i;
    if (!idRegex.test(idInput)) {
        showToast("Format ID salah! Gunakan huruf/angka/strip tanpa spasi (Cth: RT1-RW2)", "error");
        document.getElementById('edit-id').focus();
        return;
    }

    const btnSimpan = document.getElementById('btn-simpan');
    btnSimpan.innerText = "Mengunggah data...";
    btnSimpan.disabled = true;

    try {
        let finalFotoUrl = currentFotoUrl;
        const fileInput = document.getElementById('edit-foto');

        // Logika Upload File ke Supabase Storage
        if (fileInput.files.length > 0) {
            btnSimpan.innerText = "Mengunggah foto...";
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${idInput}-${Date.now()}.${fileExt}`; 
            
            const { error: uploadError } = await supabaseClient.storage.from('pengurus').upload(fileName, file);
            
            if (uploadError) throw uploadError;

            const { data } = supabaseClient.storage.from('pengurus').getPublicUrl(fileName);
            finalFotoUrl = data.publicUrl;
        }

        const dataPayload = {
            nama: document.getElementById('edit-nama').value,
            jabatan: document.getElementById('edit-jabatan').value,
            masa_jabatan: document.getElementById('edit-masa').value,
            no_hp: document.getElementById('edit-nohp').value,
            deskripsi_tugas: document.getElementById('edit-deskripsi').value,
            foto_url: finalFotoUrl
        };

        let dbResult;
        if (modeForm === 'tambah') {
            dataPayload.id = idInput;
            dbResult = await supabaseClient.from('pengurus').insert([dataPayload]);
        } else {
            dbResult = await supabaseClient.from('pengurus').update(dataPayload).eq('id', idInput);
        }

        if (dbResult.error) throw dbResult.error;

        showToast("Data berhasil disimpan!", "success");
        tutupModal();
        muatDataPengurus();

    } catch (err) {
        console.error(err);
        showToast("Gagal memproses data: " + err.message, "error");
    } finally {
        btnSimpan.innerText = "Simpan";
        btnSimpan.disabled = false;
    }
}

// Fungsi Hapus Data
async function hapusData(id) {
    const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus data pengurus dengan ID: ${id}?`);
    
    if (!konfirmasi) {
        return; 
    }

    try {
        const { error } = await supabaseClient
            .from('pengurus')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast(`Data ${id} berhasil dihapus!`, "success");
        muatDataPengurus(); 

    } catch (err) {
        console.error(err);
        showToast("Gagal menghapus data: " + err.message, "error");
    }
}

// -----------------------------------------------------------------
// FITUR GENERATE, CETAK, DAN UNDUH QR CODE
// -----------------------------------------------------------------

function bukaModalQR(id, nama) {
    document.getElementById('qr-modal').style.display = 'flex';
    document.getElementById('qr-title').innerText = `${nama} (${id})`;
    
    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = ''; // Bersihkan QR lama jika ada
    
    // Bentuk tautan yang akan diubah menjadi QR
    const profilUrl = `${BASE_PUBLIC_URL}/index.html?id=${id}`;
    document.getElementById('qr-link').innerText = profilUrl;
    
    // Generate QR Code baru
    qrcodeInstance = new QRCode(qrContainer, {
        text: profilUrl,
        width: 180, // Ukuran ideal untuk stiker (sekitar 4-5 cm)
        height: 180,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H // Toleransi kerusakan tinggi agar mudah discan
    });
}

function tutupModalQR() {
    document.getElementById('qr-modal').style.display = 'none';
}

function cetakQR() {
    // Mengambil elemen gambar QR Code
    const qrHTML = document.getElementById('qr-container').innerHTML;
    const namaTitle = document.getElementById('qr-title').innerText;
    
    // Membuka jendela (tab) baru khusus untuk pencetakan
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak Stiker QR</title>
            <style>
                @page { size: auto; margin: 0mm; } /* Menghilangkan margin default saat print */
                body { 
                    display: flex; flex-direction: column; align-items: center; justify-content: center; 
                    padding: 20px; font-family: 'Segoe UI', sans-serif; text-align: center; 
                }
                .sticker-box {
                    border: 2px solid #000;
                    padding: 15px;
                    border-radius: 10px;
                    display: inline-block;
                }
                h3 { margin: 0 0 10px 0; font-size: 16px; text-transform: uppercase; }
                p { margin: 10px 0 0 0; font-size: 12px; font-weight: bold; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <div class="sticker-box">
                <h3>${namaTitle}</h3>
                <div>${qrHTML}</div>
                <p>SCAN UNTUK PROFIL</p>
            </div>
            <script>
                // Tunggu gambar dirender sejenak, lalu jalankan dialog print otomatis
                setTimeout(() => {
                    window.print();
                    window.close(); // Tutup tab otomatis setelah selesai print
                }, 500);
            <\/script>
        </body>
        </html>
    `);
}

function downloadQR() {
    const qrContainer = document.getElementById('qr-container');
    // Library qrcode.js menghasilkan tag <img> di dalam container
    const img = qrContainer.querySelector('img');
    const namaTitle = document.getElementById('qr-title').innerText;
    
    if (img && img.src) {
        // Membuat elemen link (a) bayangan untuk proses unduh otomatis
        const link = document.createElement('a');
        link.href = img.src;
        
        // Bersihkan nama dari karakter khusus agar nama file rapi
        const namaFile = namaTitle.replace(/[^a-zA-Z0-9]/g, '_'); 
        link.download = `QR_Code_${namaFile}.png`; 
        
        document.body.appendChild(link);
        link.click(); // Memicu klik untuk download
        document.body.removeChild(link);
        
        showToast("QR Code berhasil diunduh!", "success");
    } else {
        showToast("Tunggu sebentar, gambar QR belum selesai dibuat.", "error");
    }
}