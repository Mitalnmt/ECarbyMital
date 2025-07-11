let carList = [];
let carIdCounter = 1;
let changeCarIndex = null; // null: chọn xe mới, số: đổi mã xe

// Thêm xe vào danh sách hoặc đổi mã xe
function selectCarCode(carCode) {
  const modalEl = document.getElementById('carModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide(); // Đóng modal NGAY lập tức

  setTimeout(() => {
    if (changeCarIndex === null) {
      addCar(carCode);
    } else {
      if (carList[changeCarIndex].carCode !== carCode) {
        carList[changeCarIndex].oldCarCode = carList[changeCarIndex].carCode;
      }
      carList[changeCarIndex].carCode = carCode;
      changeCarIndex = null;
      saveCarListToStorage();
      renderCarList();
    }
  }, 100); // Đợi modal đóng xong mới render lại bảng
}

// Khi ấn nút chọn xe
const showModalBtn = document.getElementById('showModalBtn');
if (showModalBtn) {
  showModalBtn.addEventListener('click', function() {
    changeCarIndex = null;
  });
}

// Thêm xe vào danh sách
function addCar(carCode) {
  const now = new Date();
  const timeOut = new Date(now.getTime());  // Thời gian ra là thời gian hiện tại
  const timeIn = new Date(timeOut.getTime());  // Thời gian vào là 15 phút sau thời gian ra
  timeIn.setMinutes(timeOut.getMinutes() + 15);  // Thêm 15 phút vào thời gian ra để có thời gian vào

  const car = {
    id: carIdCounter++,
    carCode: carCode,
    timeOut: timeOut,
    timeIn: timeIn,
    paid: false,
    done: false,
    timeChanged: "",  // Lưu giá trị cộng trừ
  };

  carList.push(car);
  saveCarListToStorage();
  renderCarList();

  // Đóng modal sau khi chọn xe
  const modalEl = document.getElementById('carModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

// Render danh sách xe
function renderCarList() {
  const tbody = document.getElementById('car-list').getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';  // Xóa các dòng cũ

  // Đếm số lượng xe theo mã xe (không phân biệt trạng thái)
  const countByCode = {};
  carList.forEach(car => {
    countByCode[car.carCode] = (countByCode[car.carCode] || 0) + 1;
  });

  carList.forEach((car, index) => {
    const row = tbody.insertRow();

    // Kiểm tra trạng thái để set class
    if (car.isNullTime) {
      row.classList.add('null-time-done');
    } else if (car.done) {
      row.classList.add('done');
    } else if (getRemainingTimeInMillis(car.timeIn, car) <= 0) {
      row.classList.add('overdue');
    }
    // Nếu mã xe bị trùng, thêm class duplicate-done
    if (countByCode[car.carCode] >= 2) {
      row.classList.add('duplicate-done');
    }

    // Số thứ tự
    const cell1 = row.insertCell(0);
    cell1.textContent = index + 1;

    // Trạng thái
    const cell2 = row.insertCell(1);
    cell2.innerHTML = `<input type="checkbox" ${car.paid ? 'checked' : ''} onclick="togglePaid(${index})">`;

    // Mã xe
    const cell3 = row.insertCell(2);
    if (car.oldCarCode) {
      cell3.innerHTML = `<span class="old-car-code">${car.oldCarCode}</span> <span>${car.carCode}</span>`;
    } else {
      cell3.textContent = car.carCode;
    }

    // Thời gian ra (đã đổi tên thành "Thời gian")
    const cell4 = row.insertCell(3);
    const timeOutFormatted = car.timeOut.toLocaleTimeString();
    cell4.textContent = timeOutFormatted;

    // Thời gian còn lại (hiển thị đếm ngược)
    const cell5 = row.insertCell(4);
    const remainingTime = getRemainingTime(car.timeIn, car);
    cell5.innerHTML = `<span class="countdown">${remainingTime}</span>`;

    // Action buttons (các nút)
    const cell6 = row.insertCell(5); // Đây là cột thứ 6 (index 5)
    cell6.innerHTML = `
      <button class="btn btn-success" onclick="toggleDone(${index})">${car.done ? 'Resume' : 'Done'}</button>
      <button class="btn btn-warning" onclick="changeCarCode(${index})">Change ID</button>
      <button class="btn btn-info" onclick="openTimeModal(${index})">Time</button>
      <button class="btn btn-danger" onclick="deleteCar(${index})">Xóa</button>
    `;
  });

  // Cập nhật đếm ngược mỗi giây
  setTimeout(updateCountdowns, 1000);
}

// Đếm ngược thời gian
function getRemainingTime(timeIn, car) {
  if (car && car.isNullTime) {
    if (!car.nullStartTime) return '00:00';
    const now = Date.now();
    const elapsed = Math.floor((now - car.nullStartTime) / 1000); // giây
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  if (car && car.done && car.pausedAt !== undefined) {
    if (car.pausedAt <= 0) return '00:00';
    const minutes = Math.floor(car.pausedAt / 60000);
    const seconds = Math.floor((car.pausedAt % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  const remainingTimeInMillis = getRemainingTimeInMillis(timeIn, car);
  if (remainingTimeInMillis <= 0) return '00:00';
  const minutes = Math.floor(remainingTimeInMillis / 60000);
  const seconds = Math.floor((remainingTimeInMillis % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Tính thời gian còn lại trong mili giây
function getRemainingTimeInMillis(timeIn, car) {
  if (car && car.isNullTime) return 0;
  if (car && car.done && car.pausedAt !== undefined) {
    return car.pausedAt;
  }
  const now = new Date();
  return timeIn - now;
}

// Cập nhật tất cả thời gian còn lại
function updateCountdowns() {
  renderCarList();  // Re-render the list to update countdowns and colors
}

// Toggle trạng thái thanh toán
function togglePaid(index) {
  carList[index].paid = !carList[index].paid;
  saveCarListToStorage();
}

// Đổi mã xe
function changeCarCode(index) {
  changeCarIndex = index;
  // Mở modal
  const modalEl = document.getElementById('carModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

// Thay đổi thời gian
function changeTime(index, delta = 1) {
  const car = carList[index];
  
  // Kiểm tra và thay đổi thời gian vào, giữ nguyên thời gian ra
  const newTimeIn = new Date(car.timeIn);
  newTimeIn.setSeconds(newTimeIn.getSeconds() + delta * 60);

  // Kiểm tra nếu thời gian vào không được phép nhỏ hơn thời gian ra
  if (newTimeIn < car.timeOut) {
    alert('Thời gian vào không thể nhỏ hơn thời gian ra!');
    return;
  }

  car.timeIn = newTimeIn;
  saveCarListToStorage();

  // Chỉ cập nhật lại countdown và class cho dòng này
  const tbody = document.getElementById('car-list').getElementsByTagName('tbody')[0];
  const row = tbody.rows[index];
  if (row) {
    // Cập nhật countdown
    const countdownCell = row.cells[4];
    if (countdownCell) {
      countdownCell.innerHTML = `<span class="countdown">${getRemainingTime(car.timeIn, car)}</span>`;
    }
    // Cập nhật class
    row.classList.remove('done', 'overdue');
    if (car.done) {
      row.classList.add('done');
    } else if (getRemainingTimeInMillis(car.timeIn, car) <= 0) {
      row.classList.add('overdue');
    }
  }
}

// Đánh dấu xe đã vào hoặc resume
function toggleDone(index) {
  const car = carList[index];
  if (car.isNullTime) {
    // Nếu đang null, bỏ null, bỏ done, bỏ nullStartTime
    car.isNullTime = false;
    car.done = false;
    car.nullStartTime = undefined;
  } else if (!car.done) {
    car.done = true;
    car.pausedAt = getRemainingTimeInMillis(car.timeIn, car);
  } else {
    car.done = false;
    if (car.pausedAt > 0) {
      const now = new Date();
      car.timeIn = new Date(now.getTime() + car.pausedAt);
    }
    car.pausedAt = undefined;
  }
  saveCarListToStorage();
  renderCarList();
}

// Xóa xe khỏi danh sách
function deleteCar(index) {
  if (!confirm('Bạn có chắc chắn muốn xóa dòng này?')) return;
  carList.splice(index, 1);
  saveCarListToStorage();
  renderCarList();
}

// --- Lưu trữ localStorage ---
function saveCarListToStorage() {
  // Chuyển Date thành string ISO để lưu
  const data = carList.map(car => ({
    ...car,
    timeOut: car.timeOut.toISOString(),
    timeIn: car.timeIn.toISOString(),
  }));
  localStorage.setItem('carList', JSON.stringify(data));
  localStorage.setItem('carIdCounter', carIdCounter);
}

function loadCarListFromStorage() {
  const data = localStorage.getItem('carList');
  if (data) {
    carList = JSON.parse(data).map(car => ({
      ...car,
      timeOut: new Date(car.timeOut),
      timeIn: new Date(car.timeIn),
    }));
  }
  const idCounter = localStorage.getItem('carIdCounter');
  if (idCounter) carIdCounter = Number(idCounter);
}

// Gọi khi trang load
loadCarListFromStorage();
renderCarList();

// --- Xóa tất cả ---
let confirmDeleteAllCount = 0;
const deleteAllBtn = document.getElementById('deleteAllBtn');
const confirmDeleteAllBtn = document.getElementById('confirmDeleteAllBtn');
const confirmDeleteAllModalEl = document.getElementById('confirmDeleteAllModal');
const confirmDeleteAllCountSpan = document.getElementById('confirmDeleteAllCount');
let confirmDeleteAllModal;
if (confirmDeleteAllModalEl) {
  confirmDeleteAllModal = bootstrap.Modal.getOrCreateInstance(confirmDeleteAllModalEl);
}
if (deleteAllBtn) {
  deleteAllBtn.addEventListener('click', function() {
    confirmDeleteAllCount = 0;
    if (confirmDeleteAllCountSpan) confirmDeleteAllCountSpan.textContent = '0';
    if (confirmDeleteAllModal) confirmDeleteAllModal.show();
  });
}
if (confirmDeleteAllBtn) {
  confirmDeleteAllBtn.addEventListener('click', function() {
    confirmDeleteAllCount++;
    if (confirmDeleteAllCountSpan) confirmDeleteAllCountSpan.textContent = confirmDeleteAllCount;
    if (confirmDeleteAllCount >= 5) {
      carList = [];
      saveCarListToStorage();
      renderCarList();
      if (confirmDeleteAllModal) confirmDeleteAllModal.hide();
    }
  });
}

// --- Modal chọn thời gian ---
let currentTimeIndex = null;
const timeModalEl = document.getElementById('timeModal');
const timeModal = timeModalEl ? bootstrap.Modal.getOrCreateInstance(timeModalEl) : null;
const minus5Btn = document.getElementById('minus5Btn');
const minus1Btn = document.getElementById('minus1Btn');
const plus1Btn = document.getElementById('plus1Btn');
const plus5Btn = document.getElementById('plus5Btn');
const nullTimeBtn = document.getElementById('nullTimeBtn');

function openTimeModal(index) {
  currentTimeIndex = index;
  if (timeModal) timeModal.show();
}

function changeTimeByDelta(deltaMin) {
  if (currentTimeIndex === null) return;
  const car = carList[currentTimeIndex];
  if (car.isNullTime) car.isNullTime = false; // Nếu đang null thì bỏ null khi chỉnh lại
  const newTimeIn = new Date(car.timeIn);
  newTimeIn.setMinutes(newTimeIn.getMinutes() + deltaMin);
  if (newTimeIn < car.timeOut) {
    alert('Thời gian vào không thể nhỏ hơn thời gian ra!');
    return;
  }
  car.timeIn = newTimeIn;
  saveCarListToStorage();
  renderCarList();
}

if (minus5Btn) minus5Btn.onclick = () => { changeTimeByDelta(-5); };
if (minus1Btn) minus1Btn.onclick = () => { changeTimeByDelta(-1); };
if (plus1Btn) plus1Btn.onclick = () => { changeTimeByDelta(1); };
if (plus5Btn) plus5Btn.onclick = () => { changeTimeByDelta(5); };
if (nullTimeBtn) nullTimeBtn.onclick = () => {
  if (currentTimeIndex === null) return;
  const car = carList[currentTimeIndex];
  car.isNullTime = true;
  car.done = true;
  car.nullStartTime = Date.now();
  saveCarListToStorage();
  renderCarList();
  if (timeModal) timeModal.hide();
};
