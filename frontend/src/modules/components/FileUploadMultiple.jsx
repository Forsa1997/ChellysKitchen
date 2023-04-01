import { useState } from 'react';
import { Button } from '@mui/material';
import { FileUpload } from '@mui/icons-material';

function FileUploadMultiple() {
    const [fileList, setFileList] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFileList([...fileList, ...files]);
    };

    const handleUploadClick = () => {
        if (fileList.length === 0) {
            return;
        }

        // 👇 Create new FormData object and append files
        const data = new FormData();
        fileList.forEach((file, i) => {
            data.append(`file-${i}`, file, file.name);
        });

        // 👇 Uploading the files using the fetch API to the server
        fetch('localhost', {
            method: 'POST',
            body: data,
        })
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    const handleRemoveClick = (index) => {
        const newFileList = [...fileList];
        newFileList.splice(index, 1);
        setFileList(newFileList);
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} multiple style={{ display: 'none' }} id="file-input" />
            <label htmlFor="file-input">
                <Button component="span" variant="outlined" sx={{ marginTop: "16px" }} startIcon={<FileUpload />}>
                    Select Files
                </Button>
            </label>
            <ul>
                {fileList.map((file, i) => (
                    <li key={i}>
                        {file.name} - {file.type}
                        <Button color="secondary" variant="outlined" onClick={() => handleRemoveClick(i)}>Remove</Button>
                    </li>
                ))}
            </ul>
            <Button onClick={handleUploadClick} variant="contained" color="primary">
                Upload
            </Button>
        </div>
    );
}

export default FileUploadMultiple;
