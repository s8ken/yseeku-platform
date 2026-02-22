"""
Setup configuration for SONATE Trust Receipts Python SDK
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="sonate-trust-receipts",
    version="1.0.0",
    author="SONATE",
    description="Cryptographically sign and verify AI interactions - SSL for AI",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/s8ken/yseeku-platform",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "License :: OSI Approved :: MIT License",
    ],
    python_requires=">=3.9",
    install_requires=[
        "PyNaCl>=1.5.0",
        "json-canonicalize>=1.0",
    ],
)
