import * as React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import FileUploadSingle from './FileUploadSingle';
import FileUploadMultiple from './FileUploadMultiple';

export default function PaymentForm() {
    return (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Images
            </Typography>
            <Grid container spacing={3}>
                <Grid sx={{ display: "flex", flexDirection: "column" }} item xs={12} md={6}>
                    <FileUploadSingle />
                    <FileUploadMultiple />
                </Grid>
            </Grid>
        </React.Fragment>
    );
}