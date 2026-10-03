# Question Paper Maker

A single-page web app for schools. One teacher sends a question paper as a Word file; another teacher opens it here, fixes mistakes, and prints it in the school format.

## Features
- Upload a .docx file. If it holds several papers, choose one from a list.
- Edit the questions in a text box and see the paper update live.
- Class 1 to 3: portrait, one paper per page. Class 4 to 10: landscape, two copies per sheet with a cut line.
- Pages fill automatically. Type `[page]` to force a new page.
- Choose paper font, paper style and screen theme.
- Print or save as PDF, or download a Word (.docx) file.
- Dashboard with the history of papers created: search, filter by class, reopen, delete, and back up.
- One upload box accepts Word (.docx), PDF, photos, scans, handwritten papers and text files. It builds the paper and updates the paper details from the file. Handwriting needs the Claude-hosted page; the GitHub version uses a built-in reader for printed text only.
- Many Word fonts to choose from, or type any font name installed on your computer.

## How to use
Keep `index.html`, `style.css` and `app.js` in the same folder and open `index.html` in a browser (Chrome recommended). No install or server is needed. It needs internet for the Word-reading library and fonts.

## Question format
```
I. Choose the correct answer. 4 x 1 = 4M
1. Which part of the plant makes food? ( )
a) Root b) Stem c) Leaf d) Flower
A | B
Horse | Hive
[image]
[lines 2]
[page]
```

## Publish with GitHub Pages
Repository Settings > Pages > Deploy from branch `main` / root.

## Files
- `index.html` - page structure
- `style.css` - styling and print layout
- `app.js` - reading Word files, cleaning text, page fitting, printing, .docx download

## History
The dashboard history is stored in the browser (localStorage) of the computer being used. It is not shared between computers. Use Download backup / Restore backup to move it. Sharing one history across all teachers needs a small server database.
