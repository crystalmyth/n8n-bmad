# Data Transformation Patterns

This directory contains reusable n8n workflow patterns for data transformation.

## Available Patterns

| Pattern | File | Description |
|---------|------|-------------|
| Batch Processing | `batch-processing.json` | Handle large datasets in batches |
| Pagination | `pagination.json` | Fetch all pages from paginated APIs |
| Data Enrichment | `data-enrichment.json` | Augment data from additional sources |
| Format Conversion | `format-conversion.json` | Convert between data formats |

## When to Use

### Batch Processing
- Processing more than 100 items
- API calls with rate limits
- Memory-intensive operations
- Parallel processing needs

### Pagination
- APIs that return paginated results
- Fetching complete datasets
- Cursor-based or offset-based APIs
- Streaming large result sets

### Data Enrichment
- Adding data from secondary sources
- Lookups and reference data
- Combining multiple data sources
- Augmenting records with metadata

### Format Conversion
- JSON to CSV/XML conversion
- Data normalization
- Schema transformation
- Report generation

## Best Practices

1. **Know your limits** - Understand API rate limits and memory constraints
2. **Process incrementally** - Don't load everything into memory
3. **Handle failures** - Some items may fail, don't lose successful ones
4. **Track progress** - Log batch numbers and progress
5. **Test with production volumes** - Verify performance at scale
