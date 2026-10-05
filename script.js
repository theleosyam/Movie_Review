/* =====================================================
   MYMOVIEBOOK
   Movie Review & Wishlist Platform

   Technology:
   HTML
   CSS
   JavaScript
   TMDB API
   LocalStorage
===================================================== */


// =====================================================
// CONFIGURATION
// =====================================================

const API_KEY = "YOUR_TMDB_API_KEY";

const API_BASE = "https://api.themoviedb.org/3";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";


// =====================================================
// LOCAL STORAGE
// =====================================================

let watchedMovies =
    JSON.parse(localStorage.getItem("watchedMovies")) || [];

let wishlistMovies =
    JSON.parse(localStorage.getItem("wishlistMovies")) || [];


// Current movie being reviewed
let currentMovie = null;


// Current personal rating
let selectedRating = 0;


// =====================================================
// DOM ELEMENTS
// =====================================================

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");

const searchResults =
    document.getElementById("searchResults");

const watchedContainer =
    document.getElementById("watchedMovies");

const wishlistContainer =
    document.getElementById("wishlistMovies");

const watchedCount =
    document.getElementById("watchedCount");

const wishlistCount =
    document.getElementById("wishlistCount");

const averageRating =
    document.getElementById("averageRating");

const movieModal =
    document.getElementById("movieModal");

const reviewModal =
    document.getElementById("reviewModal");

const movieDetails =
    document.getElementById("movieDetails");

const reviewMovieInfo =
    document.getElementById("reviewMovieInfo");

const reviewText =
    document.getElementById("reviewText");

const starInput =
    document.getElementById("starInput");


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    updateDashboard();

    renderWatched();

    renderWishlist();

    setupNavigation();

    setupStars();

});


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

    const buttons =
        document.querySelectorAll(".nav-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const section =
                button.dataset.section;

            showSection(section);

        });

    });

}


function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


    document
        .getElementById(sectionId)
        .classList.add("active-section");


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.section === sectionId
            ) {
                button.classList.add("active");
            }

        });

}


// =====================================================
// SEARCH
// =====================================================

searchBtn.addEventListener(
    "click",
    searchMovies
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            searchMovies();

        }

    }
);


async function searchMovies() {

    const query =
        searchInput.value.trim();


    if (!query) {

        alert("Please enter a movie name.");

        return;

    }


    if (
        !API_KEY ||
        API_KEY === "YOUR_TMDB_API_KEY"
    ) {

        searchResults.innerHTML = `
            <div class="empty-message">

                <h3>TMDB API Key Required</h3>

                <p>
                    Open script.js and replace
                    YOUR_TMDB_API_KEY with your TMDB API key.
                </p>

            </div>
        `;

        return;

    }


    searchResults.innerHTML = `
        <div class="empty-message">
            Searching movies...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to fetch movies"
            );

        }


        const data =
            await response.json();


        if (!data.results.length) {

            searchResults.innerHTML = `
                <div class="empty-message">
                    No movies found.
                </div>
            `;

            return;

        }


        renderSearchResults(
            data.results
        );


    } catch (error) {

        console.error(error);

        searchResults.innerHTML = `
            <div class="empty-message">

                <h3>Something went wrong</h3>

                <p>
                    Check your API key and internet connection.
                </p>

            </div>
        `;

    }

}


// =====================================================
// SEARCH RESULTS
// =====================================================

function renderSearchResults(movies) {

    searchResults.innerHTML = "";


    movies.forEach(movie => {

        const card =
            createMovieCard(movie);

        searchResults.appendChild(card);

    });

}


// =====================================================
// MOVIE CARD
// =====================================================

function createMovieCard(movie) {

    const card =
        document.createElement("div");

    card.className = "movie-card";


    const poster =
        movie.poster_path
            ? IMAGE_BASE + movie.poster_path
            : "https://via.placeholder.com/500x750?text=No+Poster";


    const year =
        movie.release_date
            ? movie.release_date.substring(0, 4)
            : "N/A";


    card.innerHTML = `

        <img
            class="poster"
            src="${poster}"
            alt="${escapeHTML(movie.title)}"
        >

        <div class="movie-info">

            <div class="movie-title">
                ${escapeHTML(movie.title)}
            </div>

            <div class="movie-year">
                ${year}
            </div>

            <div class="tmdb-rating">
                ★ ${movie.vote_average
                    ? movie.vote_average.toFixed(1)
                    : "N/A"}
            </div>

            <div class="movie-actions">

                <button
                    class="small-btn"
                    data-action="details"
                >
                    Details
                </button>

                <button
                    class="small-btn primary"
                    data-action="wishlist"
                >
                    ❤️ Wishlist
                </button>

            </div>

        </div>

    `;


    card
        .querySelector('[data-action="details"]')
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openMovieDetails(movie.id);

            }
        );


    card
        .querySelector('[data-action="wishlist"]')
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                addToWishlist(movie);

            }
        );


    card.addEventListener(
        "click",
        () => openMovieDetails(movie.id)
    );


    return card;

}


// =====================================================
// MOVIE DETAILS
// =====================================================

async function openMovieDetails(movieId) {

    if (
        !API_KEY ||
        API_KEY === "YOUR_TMDB_API_KEY"
    ) {

        alert(
            "Please add your TMDB API key first."
        );

        return;

    }


    movieModal.classList.add("show");


    movieDetails.innerHTML = `
        <div class="empty-message">
            Loading movie details...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/movie/${movieId}?api_key=${API_KEY}&language=en-US`
            );


        const movie =
            await response.json();


        currentMovie = movie;


        const poster =
            movie.poster_path
                ? IMAGE_BASE + movie.poster_path
                : "https://via.placeholder.com/500x750";


        const genres =
            movie.genres
                ?.map(g => g.name)
                .join(", ") || "N/A";


        movieDetails.innerHTML = `

            <div class="details">

                <div>

                    <img
                        src="${poster}"
                        class="details-poster"
                        alt="${escapeHTML(movie.title)}"
                    >

                </div>

                <div>

                    <h1>
                        ${escapeHTML(movie.title)}
                    </h1>

                    <div class="details-meta">

                        ${movie.release_date || "Unknown"}

                        &nbsp; • &nbsp;

                        ${genres}

                        &nbsp; • &nbsp;

                        ${movie.runtime || 0} min

                    </div>

                    <div class="detail-rating">

                        ★ ${movie.vote_average
                            ? movie.vote_average.toFixed(1)
                            : "N/A"}

                        <span style="
                            color:#888;
                            font-size:12px;
                        ">
                            TMDB Rating
                        </span>

                    </div>

                    <p class="details-overview">

                        ${escapeHTML(
                            movie.overview ||
                            "No overview available."
                        )}

                    </p>


                    <div class="detail-actions">

                        <button
                            class="primary-btn"
                            id="reviewMovieBtn"
                        >
                            ⭐ Add My Review
                        </button>

                        <button
                            class="secondary-btn"
                            id="wishlistMovieBtn"
                        >
                            ❤️ Add Wishlist
                        </button>

                    </div>

                </div>

            </div>

        `;


        document
            .getElementById("reviewMovieBtn")
            .addEventListener(
                "click",
                () => {

                    closeMovieModal();

                    openReviewModal(movie);

                }
            );


        document
            .getElementById("wishlistMovieBtn")
            .addEventListener(
                "click",
                () => addToWishlist(movie)
            );


    } catch (error) {

        movieDetails.innerHTML = `
            <div class="empty-message">
                Unable to load movie details.
            </div>
        `;

    }

}


// =====================================================
// CLOSE MOVIE MODAL
// =====================================================

document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeMovieModal
    );


function closeMovieModal() {

    movieModal.classList.remove("show");

}


// =====================================================
// WISHLIST
// =====================================================

function addToWishlist(movie) {

    const exists =
        wishlistMovies.some(
            item => item.id === movie.id
        );


    if (exists) {

        alert(
            "This movie is already in your wishlist."
        );

        return;

    }


    wishlistMovies.push({

        id: movie.id,

        title: movie.title,

        poster_path: movie.poster_path,

        release_date: movie.release_date,

        vote_average: movie.vote_average

    });


    saveWishlist();


    updateDashboard();

    renderWishlist();


    alert(
        `"${movie.title}" added to your wishlist.`
    );

}


function removeFromWishlist(movieId) {

    wishlistMovies =
        wishlistMovies.filter(
            movie => movie.id !== movieId
        );


    saveWishlist();

    updateDashboard();

    renderWishlist();

}


function saveWishlist() {

    localStorage.setItem(
        "wishlistMovies",
        JSON.stringify(wishlistMovies)
    );

}


// =====================================================
// RENDER WISHLIST
// =====================================================

function renderWishlist() {

    wishlistContainer.innerHTML = "";


    if (!wishlistMovies.length) {

        wishlistContainer.innerHTML = `
            <div class="empty-message">

                <h3>Your wishlist is empty</h3>

                <p>
                    Search for movies and add them here.
                </p>

            </div>
        `;

        return;

    }


    wishlistMovies.forEach(movie => {

        const card =
            createWishlistCard(movie);

        wishlistContainer.appendChild(card);

    });

}


function createWishlistCard(movie) {

    const card =
        document.createElement("div");

    card.className = "movie-card";


    const poster =
        movie.poster_path
            ? IMAGE_BASE + movie.poster_path
            : "https://via.placeholder.com/500x750?text=No+Poster";


    const year =
        movie.release_date
            ? movie.release_date.substring(0, 4)
            : "N/A";


    card.innerHTML = `

        <img
            class="poster"
            src="${poster}"
            alt="${escapeHTML(movie.title)}"
        >

        <div class="movie-info">

            <div class="movie-title">
                ${escapeHTML(movie.title)}
            </div>

            <div class="movie-year">
                ${year}
            </div>

            <div class="movie-actions">

                <button
                    class="small-btn"
                    data-action="details"
                >
                    Details
                </button>

                <button
                    class="small-btn primary"
                    data-action="review"
                >
                    ⭐ Watched
                </button>

            </div>

            <button
                class="small-btn"
                style="width:100%;margin-top:7px;"
                data-action="remove"
            >
                Remove
            </button>

        </div>

    `;


    card
        .querySelector('[data-action="details"]')
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openMovieDetails(movie.id);

            }
        );


    card
        .querySelector('[data-action="review"]')
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openReviewModal(movie);

            }
        );


    card
        .querySelector('[data-action="remove"]')
        .addEventListener(
            "click",
            event => {

                event.stopPropagation();

                removeFromWishlist(movie.id);

            }
        );


    return card;

}


// =====================================================
// REVIEW MODAL
// =====================================================

function openReviewModal(movie) {

    currentMovie = movie;

    selectedRating = 0;

    reviewText.value = "";


    reviewMovieInfo.innerHTML = `

        <div class="review-movie">

            <img
                src="${
                    movie.poster_path
                        ? IMAGE_BASE + movie.poster_path
                        : "https://via.placeholder.com/500x750"
                }"
                alt="${escapeHTML(movie.title)}"
            >

            <div>

                <h3>
                    ${escapeHTML(movie.title)}
                </h3>

                <p>
                    ${
                        movie.release_date
                            ? movie.release_date.substring(0,4)
                            : ""
                    }
                </p>

            </div>

        </div>

    `;


    updateStarUI();


    reviewModal.classList.add("show");

}


// =====================================================
// CLOSE REVIEW MODAL
// =====================================================

document
    .getElementById("closeReviewModal")
    .addEventListener(
        "click",
        () => {

            reviewModal.classList.remove(
                "show"
            );

        }
    );


// =====================================================
// STAR RATING
// =====================================================

function setupStars() {

    const stars =
        starInput.querySelectorAll("button");


    stars.forEach(star => {

        star.addEventListener(
            "click",
            () => {

                selectedRating =
                    Number(
                        star.dataset.rating
                    );

                updateStarUI();

            }
        );


        star.addEventListener(
            "mouseenter",
            () => {

                const rating =
                    Number(
                        star.dataset.rating
                    );

                highlightStars(rating);

            }
        );

    });


    starInput.addEventListener(
        "mouseleave",
        updateStarUI
    );

}


function highlightStars(rating) {

    const stars =
        starInput.querySelectorAll("button");


    stars.forEach(star => {

        const value =
            Number(star.dataset.rating);


        star.classList.toggle(
            "active",
            value <= rating
        );

    });

}


function updateStarUI() {

    highlightStars(selectedRating);

}


// =====================================================
// SAVE REVIEW
// =====================================================

document
    .getElementById("saveReviewBtn")
    .addEventListener(
        "click",
        saveReview
    );


function saveReview() {

    if (!currentMovie) {

        return;

    }


    if (selectedRating === 0) {

        alert(
            "Please select a star rating."
        );

        return;

    }


    const review =
        reviewText.value.trim();


    if (!review) {

        alert(
            "Please write a review."
        );

        return;

    }


    const existingIndex =
        watchedMovies.findIndex(
            movie =>
                movie.id === currentMovie.id
        );


    const reviewData = {

        id: currentMovie.id,

        title: currentMovie.title,

        poster_path:
            currentMovie.poster_path,

        release_date:
            currentMovie.release_date,

        tmdb_rating:
            currentMovie.vote_average,

        personal_rating:
            selectedRating,

        review: review,

        reviewed_at:
            new Date().toISOString()

    };


    if (existingIndex !== -1) {

        watchedMovies[existingIndex] =
            reviewData;

    } else {

        watchedMovies.push(
            reviewData
        );

    }


    localStorage.setItem(
        "watchedMovies",
        JSON.stringify(watchedMovies)
    );


    // Remove from wishlist after watching
    wishlistMovies =
        wishlistMovies.filter(
            movie =>
                movie.id !== currentMovie.id
        );


    saveWishlist();


    reviewModal.classList.remove(
        "show"
    );


    updateDashboard();

    renderWatched();

    renderWishlist();


    alert(
        "Your review has been saved!"
    );

}


// =====================================================
// RENDER WATCHED
// =====================================================

function renderWatched() {

    watchedContainer.innerHTML = "";


    if (!watchedMovies.length) {

        watchedContainer.innerHTML = `
            <div class="empty-message">

                <h3>No reviews yet</h3>

                <p>
                    Search for a movie and add your first review.
                </p>

            </div>
        `;

        return;

    }


    watchedMovies
        .slice()
        .reverse()
        .forEach(movie => {

            const card =
                createReviewCard(movie);

            watchedContainer.appendChild(card);

        });

}


// =====================================================
// REVIEW CARD
// =====================================================

function createReviewCard(movie) {

    const card =
        document.createElement("div");

    card.className = "review-card";


    const poster =
        movie.poster_path
            ? IMAGE_BASE + movie.poster_path
            : "https://via.placeholder.com/500x750?text=No+Poster";


    const stars =
        "★".repeat(movie.personal_rating) +
        "☆".repeat(5 - movie.personal_rating);


    card.innerHTML = `

        <div class="review-card-top">

            <img
                src="${poster}"
                class="review-poster"
                alt="${escapeHTML(movie.title)}"
            >

            <div class="review-details">

                <h3>
                    ${escapeHTML(movie.title)}
                </h3>

                <p>
                    ${
                        movie.release_date
                            ? movie.release_date.substring(0,4)
                            : "N/A"
                    }
                </p>

                <div class="personal-stars">
                    ${stars}
                </div>

            </div>

        </div>

        <div class="review-text">

            "${escapeHTML(movie.review)}"

        </div>

        <button
            class="delete-review"
            data-id="${movie.id}"
        >
            Delete Review
        </button>

    `;


    card
        .querySelector(".delete-review")
        .addEventListener(
            "click",
            () => deleteReview(movie.id)
        );


    return card;

}


// =====================================================
// DELETE REVIEW
// =====================================================

function deleteReview(movieId) {

    const confirmDelete =
        confirm(
            "Delete this review?"
        );


    if (!confirmDelete) {

        return;

    }


    watchedMovies =
        watchedMovies.filter(
            movie => movie.id !== movieId
        );


    localStorage.setItem(
        "watchedMovies",
        JSON.stringify(watchedMovies)
    );


    updateDashboard();

    renderWatched();

}


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {

    watchedCount.textContent =
        watchedMovies.length;


    wishlistCount.textContent =
        wishlistMovies.length;


    if (!watchedMovies.length) {

        averageRating.textContent =
            "0.0";

        return;

    }


    const total =
        watchedMovies.reduce(
            (sum, movie) =>
                sum + movie.personal_rating,
            0
        );


    const average =
        total / watchedMovies.length;


    averageRating.textContent =
        average.toFixed(1);

}


// =====================================================
// HTML SECURITY
// =====================================================

function escapeHTML(text) {

    if (!text) {

        return "";

    }


    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// =====================================================

window.addEventListener(
    "click",
    event => {

        if (
            event.target === movieModal
        ) {

            closeMovieModal();

        }


        if (
            event.target === reviewModal
        ) {

            reviewModal.classList.remove(
                "show"
            );

        }

    }
);