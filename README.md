# Landscape to Vertical Video Converter

A simple web-based tool to convert landscape videos to vertical (9:16) format.

## Features

*   **Drag & Drop or File Picker**: Easily upload your MP4 files.
*   **Multiple Conversion Modes**:
    *   **Blur Background**: The video is centered with a blurred version of itself as the background.
    *   **Solid Color Pad**: The video is centered with black bars on the top and bottom.
    *   **Center Crop**: The video is cropped to fill the entire 9:16 frame.
*   **Real-time Progress**: A progress bar and a loading spinner show the upload and conversion progress.
*   **Modern UI**: A clean and modern user interface built with Tailwind CSS.
*   **Reset Functionality**: Easily reset the UI to start over.
*   **Success Notifications**: Get notified when the conversion is complete and the download has started.

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd video-converter-rotation
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

## Usage

1.  Start the server:
    ```bash
    npm start
    ```
2.  Open your web browser and go to `http://localhost:3000`.
3.  Drag and drop an MP4 file or click to select a file.
4.  Choose a conversion mode.
5.  Click "Start" to begin the conversion.
6.  Once the conversion is complete, the video will be automatically downloaded by your browser.
