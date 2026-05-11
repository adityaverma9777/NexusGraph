# NexusGraph

I wanted to build a small project that could combine multiple small, freely available datasets and generate meaningful insights. The core idea was simple: I wanted to create something like Palantir that uses raw data to uncover hidden relationships and provide actionable intelligence.

This repository contains the frontend implementation for NexusGraph, an intelligence engine designed to visualize and explore complex systemic relationships across various domains including climate, economy, disease, and social indicators.

## Project Scope

At its heart, NexusGraph is about connecting the dots. I have integrated 126 datasets, processing over 10 million rows of data to build a knowledge graph that currently consists of 1,27,407 nodes and 4,01,090 relationships.

## Technical Constraints and Scaling

The graphs are stored in Neo4j. During the development process, I encountered a significant bottleneck: I reached a limit of approximately 0.4 million relationships in my current Neo4j setup. This constraint prevented me from expanding the graph to its calculated potential, as my initial predictions suggested the network would easily exceed 1 million relationships.

Because of this limitation, I could not expand the graph further in its current iteration. However, this is not the end of the project. I am currently working on improving the technical stack and exploring more robust ways to scale the system so it can reach its full potential and handle the millions of relationships I originally envisioned.

## Key Features

- Radial and Hierarchical Graph Exploration: Interactive visualization of systemic links.
- Multi-Domain Integration: Cross-referencing data from 126 disparate sources.
- Data Registry: Transparent tracking of all ingested datasets and their update frequencies.
- Real-time Insights: An engine designed to provide briefings based on the current state of the knowledge graph.

I am continuing to iterate on the backend architecture and ingestion pipelines to bypass the current scaling limits and build a truly comprehensive intelligence engine.
