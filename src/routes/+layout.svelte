<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="w-[800px] mx-auto px-4 py-8">
	{@render children()}
</div>
