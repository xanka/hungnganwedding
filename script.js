// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, addDoc, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

// Smooth scroll script for the nav links
document.querySelectorAll('.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

function countDown(element) {
    const ele = document.querySelector(element);
    // Set the date we're counting down to
    const countDownDate = new Date(ele.getAttribute('data-date')).getTime();

    // Update the countdown every second
    const countdownFunction = setInterval(function() {
    // Get today's date and time
    const now = new Date().getTime();

    // Find the distance between now and the countdown date
    const distance = countDownDate - now;

    // Time calculations for days, hours, minutes, and seconds
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    // Output the result in an element with the class "countdown"
    document.querySelector(element).innerHTML = 
        `Sắp tới rồi nè: ${days}d ${hours}h ${minutes}m ${seconds}s`;

    // If the countdown is over, display a message
    if (distance <= 0) {
        clearInterval(countdownFunction);
        ele.innerHTML = distance < 0 ? "Hẹn cưới lần sau nha" : "Hôm nay cưới á!";
    }
    }, 1000);
}
countDown('.countdown-ck');
countDown('.countdown-vk');


window.addToCalendar = function(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    const startDate = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(startDate.getTime())) {
        console.error("Invalid date format. Please use 'DD/MM/YYYY HH:MM'");
        return;
    }

    const title = encodeURIComponent("Wedding Event");
    const startTime = startDate.toISOString().replace(/-|:|\.\d+/g, "");
    const endTime = new Date(startDate.getTime() + 3600000).toISOString().replace(/-|:|\.\d+/g, "");
    const details = encodeURIComponent("Join us for a special celebration!");
    const location = encodeURIComponent("Location details");

    document.getElementById("googleLink").href = `https://calendar.google.com/calendar/r/eventedit?text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    document.getElementById("outlookLink").href = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startDate.toISOString()}&enddt=${new Date(startDate.getTime() + 3600000).toISOString()}&subject=${title}&body=${details}&location=${location}`;
    document.getElementById("microsoftLink").href = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&startdt=${startDate.toISOString()}&enddt=${new Date(startDate.getTime() + 3600000).toISOString()}&location=${location}`;
    document.getElementById("appleLink").href = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0D%0AVERSION:2.0%0D%0ABEGIN:VEVENT%0D%0ASUMMARY:${title}%0D%0ADESCRIPTION:${details}%0D%0ADTSTART:${startTime}%0D%0ADTEND:${endTime}%0D%0ALOCATION:${location}%0D%0AEND:VEVENT%0D%0AEND:VCALENDAR`;

    document.getElementById("calendarPopup").style.display = "flex";
};

window.closePopup = function() {
    if (!event || event.target === document.getElementById("calendarPopup")) {
        document.getElementById("calendarPopup").style.display = "none";
    }
}



// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAM3BYl_wHulngL68ukFNPwofkuN44IHzk",
    authDomain: "wedding-chat-71c70.firebaseapp.com",
    projectId: "wedding-chat-71c70",
    storageBucket: "wedding-chat-71c70.appspot.com",
    messagingSenderId: "1082838704026",
    appId: "1:1082838704026:web:82cb9b433cb0b9b82fe423"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const greetingHistory = document.getElementById('greetingHistory');
const greetingHistoryClone = document.getElementById('greetingHistoryClone');
const greetingInput = document.getElementById('greetingInput');
const greetingInputC = document.getElementById('greetingInputC');
const sendGreetingBtn = document.getElementById('sendGreetingBtn');
const sendGreetingBtnC = document.getElementById('sendGreetingBtnC');
const greetingContainer = document.getElementById('greetingContainer');
const greetingToggle = document.getElementById('greetingToggle');
const closeGreeting = document.getElementById('closeGreeting');
const overlay = document.getElementById('overlay');


// Generate or retrieve a unique user ID
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('userId', userId);
}

// Display greetings in history
function displayGreetings(greetings) {
    const historyELE = greetings.map(greeting => {
        // Convert Firestore timestamp to JavaScript Date if necessary
        const time = greeting.time instanceof Timestamp ? greeting.time.toDate() : new Date(greeting.time.seconds * 1000);

        return `<div class="ms-line"><strong>${greeting.name}</strong> <div class="ms">${greeting.message} </div><span>${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}</span></div>`;
    }).join('');
    greetingHistory.innerHTML = historyELE;
    greetingHistoryClone.innerHTML = historyELE
}

// Load all greetings from Firestore
async function loadGreetings() {
    const q = query(collection(db, "greetings"), orderBy("time", "asc"));
    const querySnapshot = await getDocs(q);
    const greetings = querySnapshot.docs.map(doc => doc.data());
    displayGreetings(greetings);
}

// Check if user can send a greeting based on rate limit
async function canSendGreeting() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const q = query(
        collection(db, "greetings"),
        where("userId", "==", userId),
        where("time", ">=", Timestamp.fromDate(oneHourAgo))
    );

    const recentGreetings = await getDocs(q);
    return recentGreetings.size < 5;
}

function scrollToBottom() {
    greetingHistory.scrollTop = greetingHistory.scrollHeight;
}
// Set up a MutationObserver to watch for new child nodes
const observer = new MutationObserver(() => {
    scrollToBottom();
});

// Start observing the target element for child additions
observer.observe(greetingHistory, { childList: true });
observer.observe(greetingHistoryClone, { childList: true });

// Send a greeting with rate limiting
async function sendGreeting(ele) {
    const message =  ele !== false ? greetingInputC.value.trim() : greetingInput.value.trim() ;
    const name = prompt("Nhập tên bạn:") || "Anonymous";

    if (!message) {
        alert("Viết đi ngại chi!");
        return;
    }

    if (!(await canSendGreeting())) {
        alert("You have reached the limit of 5 greetings per hour.");
        return;
    }

    // Add the greeting to Firestore
    const time = Timestamp.fromDate(new Date());
    const greeting = { userId, name, message, time };

    try {
        await addDoc(collection(db, "greetings"), greeting);
        loadGreetings(); // Reload greetings after adding a new one
        greetingInput.value = '';
        greetingInputC.value = '';
        alert("Cám ơn lời chúc tốt đẹp của bạn nhé.");
        greetingHistory.scrollTop = greetingHistory.scrollHeight;

    } catch (error) {
        console.error("Tèo lỗi nè:", error);
    }
}

// Event listener for send button
sendGreetingBtn.addEventListener('click', () => sendGreeting(false));
sendGreetingBtnC.addEventListener('click', () => sendGreeting(true));

// Load existing greetings from Firestore when the script runs
loadGreetings();

// Toggle greeting container visibility
greetingToggle.addEventListener('click', () => {
    const isVisible = greetingContainer.style.display === 'block';
    greetingContainer.style.display = isVisible ? 'none' : 'block';
    if (isVisible) {
        greetingInput.focus();
    }
});
closeGreeting.addEventListener('click', () => {
    const isVisible = greetingContainer.style.display === 'block';
    greetingContainer.style.display = isVisible ? 'none' : 'block';
    if (isVisible) {
        greetingInput.focus();
    }
});
overlay.addEventListener('click', () => {
    const isVisible = greetingContainer.style.display === 'block';
    greetingContainer.style.display = isVisible ? 'none' : 'block';
    if (isVisible) {
        greetingInput.focus();
    }
});

// allow send message while typing
greetingInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendGreeting();
    }
});
greetingInputC.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendGreeting();
    }
});

let images = [];
let currentImageIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

function loadGallery(jsonPath, containerId) {
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${jsonPath}: ${response.status}`);
            }
            return response.json();
        })
        .then(imageUrls => {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container with ID "${containerId}" not found`);
            }

            // Clear the container to avoid duplicates
            container.innerHTML = "";

            // Shuffle the array
            for (let i = imageUrls.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                [imageUrls[i], imageUrls[j]] = [imageUrls[j], imageUrls[i]]; // Swap elements
            }
            // Loop through image URLs and create gallery items
            imageUrls.forEach((imageUrl, index) => {
                const galleryItem = document.createElement("div");
                galleryItem.className = "gallery-item";
                galleryItem.onclick = () => openPopup(index);

                const img = document.createElement("img");
                img.src = 'main-images/' + imageUrl;
                img.alt = `Gallery Image ${index + 1}`;
                img.loading = "lazy"; // Lazy loading for performance

                galleryItem.appendChild(img);
                container.appendChild(galleryItem);
            });

            // Populate global images array for popup use
            images = imageUrls;
        })
        .catch(err => console.error("Failed to load gallery images:", err));
}

function openPopup(index) {
    currentImageIndex = index;
    updatePopupImage();
    const popup = document.getElementById("popup");
    popup.classList.add("active");
    addSwipeListeners();
    renderThumbnails();
}

function closePopupX() {
    document.getElementById("popup").classList.remove("active");
    removeSwipeListeners();
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    updatePopupImage();
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    updatePopupImage();
}

function updatePopupImage() {
    const popupImage = document.getElementById("popup-image");
    popupImage.src = 'main-images/' + images[currentImageIndex];
    updateThumbnails();
}

function renderThumbnails() {
    const thumbnailContainer = document.querySelector(".thumbnail");
    thumbnailContainer.innerHTML = ""; // Clear existing thumbnails
    images.forEach((src, index) => {
        const thumb = document.createElement("img");
        thumb.src = 'thumbnail-images/' + src;
        thumb.alt = `Thumbnail ${index + 1}`;
        thumb.className = index === currentImageIndex ? "active" : "";
        thumb.onclick = () => {
            currentImageIndex = index;
            updatePopupImage();
        };

        thumbnailContainer.appendChild(thumb);
    });
}

function updateThumbnails() {
    const thumbnails = document.querySelectorAll(".thumbnail img");
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.classList.toggle("active", index === currentImageIndex);
    });
}

// Swipe functionality
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
}

function handleTouchMove(event) {
    touchEndX = event.touches[0].clientX;
}

function handleTouchEnd() {
    const swipeThreshold = 50; // Minimum distance for a swipe to be registered
    if (touchStartX - touchEndX > swipeThreshold) {
        nextImage(); // Swipe left
    } else if (touchEndX - touchStartX > swipeThreshold) {
        prevImage(); // Swipe right
    }
    touchStartX = 0;
    touchEndX = 0;
}

function addSwipeListeners() {
    const popup = document.getElementById("popup");
    popup.addEventListener("touchstart", handleTouchStart, { passive: true });
    popup.addEventListener("touchmove", handleTouchMove, { passive: true });
    popup.addEventListener("touchend", handleTouchEnd, { passive: true });
}

function removeSwipeListeners() {
    const popup = document.getElementById("popup");
    popup.removeEventListener("touchstart", handleTouchStart);
    popup.removeEventListener("touchmove", handleTouchMove);
    popup.removeEventListener("touchend", handleTouchEnd);
}

// load gallery images
loadGallery("images.json", "gallery-images");

const audioPlayer = document.getElementById('audioPlayer');
window.playPause = () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        document.getElementById('playerVolumeOn').style = 'display: block';
        document.getElementById('playerVolumeOff').style = 'display: none';
    } else {
        audioPlayer.pause();
        document.getElementById('playerVolumeOn').style = 'display: none';
        document.getElementById('playerVolumeOff').style = 'display: block';
    }
}

// Expose functions to the global scope
window.openPopup = openPopup;
window.closePopupX = closePopupX;
window.nextImage = nextImage;
window.prevImage = prevImage;

})