import * as React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import withRoot from '../withRoot';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import UnstyledInputBasic from './MultilineTextField';

const AddressForm = () => {
    return (
        <React.Fragment>
            <Typography variant="h6" gutterBottom>
                Information
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TextField
                        required
                        id="recipeName"
                        name="recipeName"
                        label="Recipe Name"
                        fullWidth
                        autoComplete="given-name"
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12}>
                    <UnstyledInputBasic />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        id="bakingTime"
                        name="bakingTime"
                        label="Baking Time"
                        fullWidth
                        autoComplete="baking time"
                        variant="standard"
                    />
                </Grid>

                {/* <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        id="city"
                        name="city"
                        label="City"
                        fullWidth
                        autoComplete="shipping address-level2"
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        id="state"
                        name="state"
                        label="State/Province/Region"
                        fullWidth
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        id="zip"
                        name="zip"
                        label="Zip / Postal code"
                        fullWidth
                        autoComplete="shipping postal-code"
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        required
                        id="country"
                        name="country"
                        label="Country"
                        fullWidth
                        autoComplete="shipping country"
                        variant="standard"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Checkbox color="secondary" name="saveAddress" value="yes" />}
                        label="Use this address for payment details"
                    />
                </Grid> */}
            </Grid>
        </React.Fragment>
    );
}

export default withRoot(AddressForm);