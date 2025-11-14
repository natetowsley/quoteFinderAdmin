document.querySelector("#addQuoteForm").addEventListener("submit", checkQuote);

function checkQuote() {
    let quote = document.querySelector("#quoteText").value;
    if (quote.length < 5) {
        document.querySelector("#errorMsg").textContent = "ERROR: Quote must be longer than 4 characters";
        document.querySelector("#errorMsg").style.color = "red";
        event.preventDefault();
    }
}