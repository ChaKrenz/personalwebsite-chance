// Array of random meme URLs (you can add more or pull from an API)
const memes = [
    "https://i.imgflip.com/4/30b1gx.jpg",
    "https://i.imgflip.com/4t0m5.jpg",
    "https://i.redd.it/3vlam3p5xb871.jpg",
    "https://i.kym-cdn.com/entries/icons/facebook/000/028/021/work.jpg"
];

// Function to display a random meme
function displayRandomMeme() {
    const memeImage = document.getElementById('memeImage');
    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    memeImage.src = randomMeme;
}

// Call the function when the page loads
window.onload = displayRandomMeme;
