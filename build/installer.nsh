!macro customInit
  ; Check if Visual C++ 2015-2022 Redistributable (x64) is installed
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"

  ${If} $0 != "1"
    MessageBox MB_YESNO "This application requires the Microsoft Visual C++ Redistributable to run.$\n$\nWould you like to install it now?" /SD IDYES IDYES InstallVCRedist IDNO DontInstall

    InstallVCRedist:
      DetailPrint "Downloading Microsoft Visual C++ Redistributable..."
      inetc::get /CAPTION "Downloading Dependency" /BANNER "Downloading Microsoft Visual C++ Redistributable..." "https://aka.ms/vs/17/release/vc_redist.x64.exe" "$TEMP\vc_redist.x64.exe"

      DetailPrint "Installing Microsoft Visual C++ Redistributable..."
      ExecWait "$TEMP\vc_redist.x64.exe /install /passive /norestart"
      Delete "$TEMP\vc_redist.x64.exe"

    DontInstall:
      ; Continue with installation even if user declines
  ${EndIf}
!macroend
