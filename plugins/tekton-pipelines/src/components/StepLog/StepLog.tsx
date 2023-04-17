import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Close from "@material-ui/icons/Close";

interface Props {
  opened: boolean;
  text: string;
}

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    maxHeight: "50vh",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    fontFamily: "monospace",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
  },
  success: {
    color: 'green',
    marginLeft: theme.spacing(1),
  },  
}));

export const StepLog: React.FC<Props> = ({ opened, text }) => {
  const classes = useStyles();
  const [open, setOpen] = useState<boolean>(opened);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
      <DialogTitle>
        <Toolbar className={classes.toolbar}>
          <Typography variant="h6" style={{ flex: 1 }}>
            TaskRun Logs
          </Typography>
          <IconButton onClick={() => setOpen(false)}>
            <Close />
          </IconButton>
        </Toolbar>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <pre>{text}</pre>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy}>Copy to Clipboard</Button>
        {copied && <span className={classes.success}>Copied!</span>}
        <Button onClick={() => setOpen(false)}>Back</Button>
      </DialogActions>
    </Dialog>
  );
};

