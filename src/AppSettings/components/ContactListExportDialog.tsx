import React from "react"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import ErrorIcon from "@material-ui/icons/Error"
import { fade, useTheme } from "@material-ui/core/styles"
import DialogBody from "~Layout/components/DialogBody"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { HorizontalLayout } from "~Layout/components/Box"
import { TextField } from "@material-ui/core"

function ContactListExportDialog() {
  const theme = useTheme()

  const storageKey = `sunce:favorites:mainnet`

  const [rawContents, setRawContents] = React.useState(() => {
    return JSON.stringify(JSON.parse(localStorage.getItem(storageKey) || "[]"), null, 2)
  })

  const [error, setError] = React.useState<string>()

  const handleSaveChanges = React.useCallback(() => {
    setError("")
    try {
      const json = JSON.parse(rawContents)
      console.log(json)
      localStorage.setItem(storageKey, JSON.stringify(json))
    } catch (e) {
      console.log("!!!")
      setError("Cannot parse JSON")
    }
  }, [rawContents])

  return (
    <DialogBody>
      <DialogContent style={{ flexGrow: 0, padding: 0 }}>
        <DialogContentText align="justify" style={{ marginTop: 8 }}>
          Contact List
        </DialogContentText>

        <TextField
          fullWidth
          multiline={true}
          margin="normal"
          value={rawContents}
          onChange={e => setRawContents(e.target.value)}
          style={{
            flexGrow: 1,
            marginLeft: 24,
            marginRight: 24,
            minWidth: 230,
            height: "100%",
            paddingBottom: "45px"
          }}
        />
        <div style={{ position: "fixed", bottom: 0, right: 0 }}>
          {error && (
            <HorizontalLayout
              alignItems="center"
              style={{
                background: fade(theme.palette.error.main, 0.2),
                borderRadius: 8,
                color: theme.palette.error.main,
                fontWeight: 600,
                padding: "8px 12px"
              }}
            >
              <ErrorIcon />
              <span style={{ marginLeft: 8 }}>{error}</span>
            </HorizontalLayout>
          )}
          <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
            <ActionButton onClick={handleSaveChanges} type="primary">
              Save
            </ActionButton>
          </DialogActionsBox>
        </div>
      </DialogContent>
    </DialogBody>
  )
}

export default React.memo(ContactListExportDialog)
