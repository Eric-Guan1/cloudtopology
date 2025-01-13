# Automated Mapping of Cloud Network Topologies

## Overview

This project aims to create an automated and comprehensive mapping tool for global Internet and cloud network topologies. By leveraging web scraping, machine learning, and advanced image processing techniques, the system addresses challenges in understanding and optimizing global network infrastructures.

Key features include:
- Automated collection of cloud provider network maps.
- Image classification and segmentation for extracting node and edge information.
- Algorithms for generating graph representations and geolocating nodes.
- Use of synthetic data generation for robust training and scalability.

---

## Problem Statement

With the rapid expansion of cloud networks and the decentralized nature of the Internet, existing efforts to map global network topologies are often manual and outdated. This project solves key challenges such as:
- Lack of automated mapping tools for cloud networks.
- Difficulty analyzing the global impacts of cloud network changes.
- Inefficiencies in infrastructure development due to incomplete data.

---

## Research Questions

1. How can we create an automated map that combines physical and logical layers of cloud provider networks?
2. What methodologies can calculate expected shortest-path latency between nodes?
3. How can the system stay self-updating based on reliable source maps?

---

## Approach

### Pipeline Components:
1. **Web Scraper**: Extracts images and metadata from cloud provider websites.
2. **Image Classification**: Identifies relevant network maps using an EfficientNet-based classifier.
3. **Image Segmentation**: Processes maps to extract nodes and edges using DeepLabV3.
4. **Graph Generation**: Builds adjacency matrices and resolves edge crossings with a custom flood algorithm.
5. **Feature Mapping**: Geolocates nodes using fine-tuned LoFTR models.

### Tools and Technologies:
- **Web Scraping**: Puppeteer, Python.
- **Machine Learning**: PyTorch, EfficientNet, DeepLabV3, LoFTR.
- **Synthetic Data Generation**: Matplotlib, Basemap.
- **Data Storage**: SQLAlchemy for database integration.
- **Visualization**: Jupyter Notebooks and Matplotlib for data visualization.

---

## Results

- **Image Classification**: Achieved 84% accuracy in identifying network maps.
- **Image Segmentation**: Achieved 99.34% accuracy with an Intersection over Union (IoU) of 85.21%.
- **Graph Representation**: Successfully extracted adjacency matrices from segmented maps.
- **Geolocation Accuracy**: Improved mapping precision through fine-tuned LoFTR.

---
