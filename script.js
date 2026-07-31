const SUPABASE_URL = 'https://zpskuqsmnsrolbnvmrvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwc2t1cXNtbnNyb2xibnZtcnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDg4MTAsImV4cCI6MjEwMDcyNDgxMH0.e6ic19bbKP0BorQEiIzjKe3xtRfvXM0rRqEdY25zKcg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const urlParams = new URLSearchParams(window.location.search);
const pengurusId = urlParams.get('id');

const elLoading = document.getElementById('loading');
const elContent = document.getElementById('content-profil');
const elError = document.getElementById('error-pesan');

async function ambilDataPengurus() {
    if (!pengurusId) {
        elLoading.style.display = 'none';
        elError.style.display = 'block';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('pengurus')
            .select('*')
            .eq('id', pengurusId)
            .single(); 

        if (error) throw error;
        if (!data) throw new Error("Data Kosong");

        document.getElementById('nama').innerText = data.nama || 'Belum ada nama';
        document.getElementById('jabatan').innerText = data.jabatan || 'Belum ada jabatan';
        
        const elMasa = document.getElementById('masa_jabatan');
        if (elMasa) elMasa.innerText = data.masa_jabatan || '-';
        
        const elNoHp = document.getElementById('no_hp');
        if (elNoHp) elNoHp.innerText = data.no_hp || '-';
        
        const elDeskripsi = document.getElementById('deskripsi_tugas');
        if (elDeskripsi) {
            let teksJabatan = (data.jabatan || '').toUpperCase();
            if (teksJabatan.includes('RT')) {
                elDeskripsi.innerText = "RT bertugas melakukan pendataan penduduk, seperti mencatat warga baru, kelahiran, dan perpindahan penduduk. Selain itu, Ketua RT membantu proses administrasi awal, seperti penerbitan surat pengantar untuk pembuatan KTP dan Kartu Keluarga, serta berperan dalam menjaga keamanan, ketertiban, dan kebersihan lingkungan.";
            } else if (teksJabatan.includes('RW')) {
                elDeskripsi.innerText = "Mengkoordinasikan pelaksanaan tugas ketua-ketua RT di wilayahnya, menjadi fasilitator program kelurahan, serta menampung dan menyalurkan aspirasi masyarakat.";
            } else if (data.deskripsi_tugas) {
                elDeskripsi.innerText = data.deskripsi_tugas;
            } else {
                elDeskripsi.innerText = "Deskripsi tugas untuk jabatan ini belum tersedia.";
            }
        }

        const elLinkWa = document.getElementById('link_wa');
        if (elLinkWa) {
            if (data.no_hp) {
                // Bersihkan karakter selain angka (seperti spasi, strip, atau tanda +)
                let noHpWa = String(data.no_hp).replace(/\D/g, ''); 
                
                // LOGIKA PERBAIKAN FORMAT NOMOR WA
                if (noHpWa.startsWith('0')) {
                    // Jika depannya 0, ganti jadi 62
                    noHpWa = '62' + noHpWa.substring(1);
                } else if (noHpWa.startsWith('8')) {
                    // Jika depannya 8 (seperti 877...), tambahkan 62 di depannya
                    noHpWa = '62' + noHpWa;
                }
                // Jika sudah diawali 62, maka kode di atas akan diabaikan dan langsung lanjut ke sini
                
                elLinkWa.href = `https://wa.me/${noHpWa}`;
                elLinkWa.style.display = 'flex'; // Menggunakan flex agar icon dan text sejajar
            } else {
                elLinkWa.style.display = 'none'; 
            }
        }

        const imgFoto = document.getElementById('foto');
        if (imgFoto) {
            if (data.foto_url) {
                imgFoto.src = data.foto_url;
            } else {
                imgFoto.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"; 
            }
        }

        elLoading.style.display = 'none';
        elContent.style.display = 'block';

    } catch (err) {
        console.error("Proses eksekusi gagal:", err);
        elLoading.style.display = 'none';
        elError.style.display = 'block';
    }
}

ambilDataPengurus();