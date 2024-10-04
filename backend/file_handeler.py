class FileHandler:
    def __init__(self, filename):
        self.filename = filename
        self.lines = None

    def read_line(self, line_index):
        """Read a specific line from the file by its index (0-based)."""
        with open(self.filename, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            lines = [line for line in lines if line.strip()]  # Ignore empty lines
            if self.lines == None:
                self.lines = lines
            if 0 <= line_index < len(lines):
                return lines[line_index].strip()
            else:
                raise IndexError("Line index out of range.")

    def len_lines(self):
        with open(self.filename, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            lines = [line for line in lines if line.strip()]  # Ignore empty lines
        return len(lines)

    def append_line(self, line):
        """Append a line to the end of the file."""
        with open(self.filename, 'a') as file:
            file.write(line + '\n')

    def load_lines(self):
        """Load all lines from the file into a list."""
        with open(self.filename, 'r', encoding='utf-8') as file:
            return [line.strip() for line in file.readlines()]

    def escape_quotes(self, text):
        return text.replace('"', '\\"').replace("'", "\\'")

    def unescape_quotes(self, text):
        return text.replace('\\"', '"').replace("\\'", "'")


if __name__ == '__main__':
    pass
    # fh = FileHandler('prompts.txt')
    # p = 'A little cute bunny sitting on the steps outside the house'
    # fh.append_line(escape_quotes(p))
    # line = fh.read_line(0)  # Reads the third line (0-based index)
    # print(line)
    # # lines = fh.load_lines()
