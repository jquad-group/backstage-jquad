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
import Fullscreen from "@material-ui/icons/Fullscreen";

interface Props {
  opened: boolean;
  text: string;
}

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    maxHeight: "90vh",
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(prevState => !prevState);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullScreen={isFullscreen}>
      <DialogTitle>
        <Toolbar className={classes.toolbar}>
          <Typography variant="h6" style={{ flex: 1 }}>
            TaskRun Logs
          </Typography>
          <IconButton onClick={toggleFullscreen}>
            <Fullscreen />
          </IconButton>          
          <IconButton onClick={() => setOpen(false)}>
            <Close />
          </IconButton>
        </Toolbar>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <pre>{text}</pre>
      </DialogContent>
      { isFullscreen && 
      <DialogActions>
        <Button onClick={handleCopy}>Copy to Clipboard</Button>
        {copied && <span className={classes.success}>Copied!</span>}
        <Button onClick={() => setOpen(false)}>Back</Button>
      </DialogActions>
      }
      { !isFullscreen && 
      <DialogActions>
        <Button onClick={handleCopy}>Copy to Clipboard</Button>
        {copied && <span className={classes.success}>Copied!</span>}
        <Button onClick={() => setOpen(false)}>Back</Button>
      </DialogActions>
      }
    </Dialog>
  );
};

