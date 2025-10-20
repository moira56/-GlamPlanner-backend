import express from 'express';

const app = express();
app.use(express.json());

let PORT = 3000;

app.listen(PORT, error => {
    if (error) {
        console.error(`Greška prilikom pokretanja poslužitelja: ${error.message}`);
    } 
    else {
        console.log(`Poslužitelj radi na http://localhost:${PORT}`);
    }
});