# Board generation in Python
# run get_board(<word>)

SIZE = 4

def create_prefix_sets(words):
    word_list = {SIZE - 1: set(), SIZE: set()}
    prefix_sets = {SIZE - 1: set(), SIZE: set()}
    
    for line in words:
        word = line.strip().upper()
        length = len(word)
        
        if SIZE - 1 <= length <= SIZE:
            word_list[length].add(word)
            
            for i in range(1, length + 1):
                prefix_sets[length].add(word[:i])
                
    return prefix_sets, word_list

words = csv_to_wordlist()
prefix_sets, word_list = create_prefix_sets(words)
used_words = set()

def get_board(top_word):
    global used_words
    used_words = set()

    board = [[""] * SIZE for _ in range(SIZE)]
    board[0] = list(top_word) # "NEWS"
    used_words.add(top_word)
    
    if solve_board(board):
        return "".join(["".join(row) for row in board]) + "*"
    else:
        return False

def columns_are_valid(board):
    for col in range(SIZE):
        num_rows = (SIZE - 1) if col == (SIZE - 1) else SIZE
        column_word = "".join([board[row][col] for row in range(num_rows)])
        if column_word not in prefix_sets[num_rows] or column_word in used_words:
            return False
    return True

def partial_columns_are_valid(board, row_index):
    for col in range(SIZE):
        num_rows = (SIZE - 1) if col == (SIZE - 1) else SIZE
        column_word = "".join([board[row][col] for row in range(min(num_rows, row_index + 1))])
        if column_word not in prefix_sets[num_rows]:
            return False
    return True

def print_board(board):
    for row in board:
        print("".join(row))

def solve_board(board, row_index=1):
    if row_index == SIZE:
        if columns_are_valid(board):
            return True
        return False
    
    word_length = (SIZE - 1) if row_index == (SIZE - 1) else SIZE
    words = word_list[word_length]
    
    for word in words:
        word = word.upper()
        board[row_index] = list(word)
        
        if word not in used_words:
            used_words.add(word)
            if partial_columns_are_valid(board, row_index):
                if solve_board(board, row_index + 1):
                    return True
        
            used_words.remove(word)
        board[row_index] = [""] * SIZE
    
    return False

def csv_to_wordlist():
    words_file = open('wordslist.csv', 'r')
    words = []
    
    c = 0
    for line in words_file:
        if c == 0:
            c += 1
            continue
        c += 1
        words.append(line.split(',')[0].upper())
        
    return words


  
