import { Button, Input } from '@mui/material';
import { useState } from 'react';
import { FileUpload } from '@mui/icons-material';

function FileUploadSingle() {
    const [file, setFile] = useState();

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        if (!file) {
            return;
        }

        // 👇 Uploading the file using the fetch API to the server
        fetch('localhost', {
            method: 'POST',
            body: file,
            // 👇 Set headers manually for single file upload
            headers: {
                'content-type': file.type,
                'content-length': `${file.size}`, // 👈 Headers need to be a string
            },
        })
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    return (
        <div>
            <label sx={{ display: 'flex' }} htmlFor="file-upload">
                <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }} />
                <Button component="span" variant="outlined">
                    <FileUpload />
                    Select Cover
                </Button>
                <div>{file && `${file.name} - ${file.type}`}</div>
            </label>
            <Button sx={{ marginTop: '16px' }} variant="contained" onClick={handleUploadClick}>
                Upload
            </Button>
        </div>
    );
}

export default FileUploadSingle;
