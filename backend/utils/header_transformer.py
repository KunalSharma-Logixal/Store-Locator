import re
from typing import List, Dict, Any, Optional

class HeaderTransformer:
    def __init__(self, mapping_config: Dict[str, List[str]]):
        self.mapping_config = mapping_config

    def _clean(self, value: str) -> str:
        """
        Neutralizes casing, spacing, symbols, dashes, and underscores.
        e.g., "Latitude Value" -> "latitudevalue", "Store_ID" -> "storeid".
        """
        if not value:
            return ""
        return re.sub(r'[^a-z0-9]', '', str(value).strip().lower())

    def transform(self, headers: List[str]) -> Dict[str, Optional[str]]:
        """
        Transforms raw file headers into standard target fields based on the transformation map.
        Returns a dictionary mapping target fields to their matched raw header names.
        """
        transformed = {}
        
        # Pre-clean the variations in configuration
        cleaned_config = {
            target: [self._clean(alias) for alias in aliases]
            for target, aliases in self.mapping_config.items()
        }

        for target, clean_aliases in cleaned_config.items():
            matched_header = None
            for h in headers:
                clean_h = self._clean(h)
                if clean_h in clean_aliases:
                    matched_header = h
                    break
            transformed[target] = matched_header

        return transformed
