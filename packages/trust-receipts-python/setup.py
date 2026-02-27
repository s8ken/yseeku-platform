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
    author_email="sdk@yseeku.com",
    description="Cryptographically sign and verify AI interactions - SSL for AI",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/s8ken/yseeku-platform",
    packages=find_packages(exclude=["tests*"]),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "License :: OSI Approved :: MIT License",
        "Intended Audience :: Developers",
        "Topic :: Security :: Cryptography",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    python_requires=">=3.9",
    install_requires=[
        "PyNaCl>=1.5.0",
        "json-canonicalize>=1.0",
    ],
    extras_require={
        "dev": ["pytest>=7.0", "pytest-asyncio>=0.23"],
    },
)
