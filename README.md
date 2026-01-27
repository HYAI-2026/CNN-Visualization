# CNN-Visualization

> *Interactive 3D visualization of a Convolutional Neural Network (CNN) for handwritten digit recognition.*

## 📝 Introduction
This project is a web-based visualization tool designed to demonstrate the internal workings of a Convolutional Neural Network. It allows users to draw digits (0-9) on a canvas and observe how the data propagates through the network layers in real-time, culminating in a prediction.

This tool aims to provide an intuitive understanding of deep learning architectures for educational and research purposes.

**Powered by HYAI (Hanyang Artificial Intelligence)**

## ✨ Key Features

* **Interactive Canvas**: Draw digits directly using the mouse to test the model's inference capabilities.
* **Real-Time 3D Visualization**: View the activation of neurons across different layers (Input, Conv, Pooling, Fully Connected) in a dynamic 3D space.
* **Live Prediction**: Instant classification results with a probability bar chart showing confidence scores for each digit (0-9).
* **Layer Inspection**: Visualize how features are extracted and processed at each stage of the network.

## 🛠 Tech Stack

* **Frontend Framework**: Svelte (Vite)
* **Language**: TypeScript
* **3D Graphics**: Three.js
* **Machine Learning**: TensorFlow (Training), TensorFlow.js (Inference)
* **Styling**: CSS3

## 🚀 How to Run

1.  **Clone the repository**
    ```bash
    git clone https://github.com/HYAI-2026-GADU/CNN-Visualization.git
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the server**
    ```bash
    npm run dev
    ```

## 👥 Contributors

* **HYAI 2026 GADU Team**
* Main Developer: Sangbong Kim/ksbong06

## 📄 License

This project is licensed under the MIT License.