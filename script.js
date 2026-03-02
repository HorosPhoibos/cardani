// --- Fitur Jam Real-Time untuk Dashboard ---
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        clockElement.textContent = timeString + ' WIB';
    }
}
setInterval(updateClock, 1000);

// --- Fitur Kalkulator Cor Beton (Real Calculation) ---
document.getElementById('btnHitung').addEventListener('click', function() {
    // Ambil nilai dari input form
    let p = parseFloat(document.getElementById('panjang').value);
    let l = parseFloat(document.getElementById('lebar').value);
    let t = parseFloat(document.getElementById('tebal').value) / 100; // Konversi cm ke meter

    let hasilDiv = document.getElementById('hasilCor');

    if(p > 0 && l > 0 && t > 0) {
        // Menghitung Volume Beton (m3)
        let volume = p * l * t; 
        
        // Estimasi Kebutuhan Material (Rasio Campuran 1:2:3 / Mutu Beton Pendekatan K-175 s/d K-225)
        // Standar: 1 m3 beton butuh ~7 sak semen (50kg), 0.5 m3 pasir, 0.8 m3 batu split
        let semen = Math.ceil(volume * 7); 
        let pasir = (volume * 0.5).toFixed(2); 
        let split = (volume * 0.8).toFixed(2); 
        
        // Kalkulasi Logistik (Kapasitas truk engkel/pick-up bak +/- 3 hingga 4 m3 per ritase)
        let totalMaterial Alam = parseFloat(pasir) + parseFloat(split);
        let ritase = Math.ceil(totalMaterialAlam / 3.5);

        // Tampilkan Hasil
        hasilDiv.classList.remove('hidden');
        hasilDiv.innerHTML = `
            <div class="text-left">
                <h3 class="text-xl font-bold text-blue-900 mb-2">Hasil Kalkulasi Volume: ${volume.toFixed(2)} m&sup3;</h3>
                <p class="mb-2 font-medium text-gray-600">Estimasi Material Bersih (Rasio 1:2:3):</p>
                <div class="bg-yellow-100 p-4 rounded-lg mb-4">
                    <ul class="list-disc ml-5 font-bold text-gray-800 space-y-1">
                        <li>Semen (50kg) : ${semen} Sak</li>
                        <li>Pasir Cor : ${pasir} m&sup3;</li>
                        <li>Batu Split (Kerikil) : ${split} m&sup3;</li>
                    </ul>
                </div>
                <div class="border-t border-gray-300 pt-3">
                    <p class="text-sm text-gray-700 leading-relaxed">
                        🚚 <b>Info Logistik:</b> Total muatan pasir dan split sekitar ${totalMaterialAlam.toFixed(2)} m&sup3;. Muatan ini membutuhkan estimasi sekitar <b>${ritase} rit</b> angkutan truk bak (engkel). Kalau material ini disubkon angkutannya ke armada truk sendiri via aplikasi Lalamove, lumayan banget kan bisa buat nambah-nambah cuan bersih Rp 100.000 - Rp 150.000 per harinya!
                    </p>
                </div>
            </div>
        `;
    } else {
        hasilDiv.classList.remove('hidden');
        hasilDiv.innerHTML = '<span class="text-red-600 font-bold">Harap masukkan angka yang benar, Bos! Panjang, Lebar, dan Tebal tidak boleh kosong atau nol.</span>';
    }
});