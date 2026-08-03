; NSIS Extra Script for Devil AI Installer
; Checks for Git and OpenCode during installation

!macro preInit
  ; Check if Git is available during install
  nsExec::ExecToStack 'where git'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_YESNO|MB_ICONQUESTION "Git is not installed on your system.$\n$\nGit is recommended for version control features.$\n$\nWould you like to install Git now?" IDNO skipGit
    ; Try to install Git via winget
    nsExec::ExecToStack 'winget install --id Git.Git --accept-source-agreements --accept-package-agreements'
    Pop $1
    ${If} $1 != 0
      MessageBox MB_OK|MB_ICONEXCLAMATION "Git installation failed. You can install it manually later."
    ${Else}
      MessageBox MB_OK|MB_ICONINFORMATION "Git installed successfully!"
    ${EndIf}
    skipGit:
  ${EndIf}
!macroend
